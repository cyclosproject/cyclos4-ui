import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router, Params } from '@angular/router';
import {
  NotificationLevelEnum, Operation, OperationDataForRun,
  OperationResultTypeEnum, OperationScopeEnum, RunOperationResult
} from 'app/api/models';
import { OperationsService } from 'app/api/services';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { NotificationService } from 'app/core/notification.service';
import { ApiHelper } from 'app/shared/api-helper';
import { downloadResponse, empty } from 'app/shared/helper';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { HeadingAction } from 'app/shared/action';

/**
 * Types which can run actions directly without going to the run page
 */
const TypesRunDirectly: OperationResultTypeEnum[] = [
  OperationResultTypeEnum.NOTIFICATION,
  OperationResultTypeEnum.FILE_DOWNLOAD,
  OperationResultTypeEnum.URL,
  OperationResultTypeEnum.EXTERNAL_REDIRECT
];

/**
 * Helper for registering known operations and running them
 */
@Injectable({
  providedIn: 'root'
})
export class OperationHelperService {
  private registry = new Map<string, Operation>();

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private notification: NotificationService,
    private breadcrumb: BreadcrumbService,
    private router: Router,
    private operationsService: OperationsService) {
    dataForUiHolder.subscribe(dataForUi => {
      // Store all custom operations in the registry
      const operations = ((((dataForUi || {}).auth || {}).permissions || {}).operations || {});
      (operations.system || []).forEach(o => this.register(o.operation));
      (operations.user || []).forEach(o => this.register(o.operation));
    });
  }

  /**
   * Registers a known custom operation. Ingores null / undefined.
   */
  register(operation: Operation) {
    if (operation) {
      this.registry.set(operation.id, operation);
      if (operation.internalName) {
        this.registry.set(operation.internalName, operation);
      }
    }
  }

  /**
   * Returns an operation by internal name or id
   */
  get(key: string): Operation {
    return this.registry.get(key);
  }

  /**
   * If the operation can be executed directly, run it.
   * Otherwise, go to the run action page for the given operation.
   * @param operation The operation to run
   * @param scopeId The id of the scoping entity, such as user, advertisement, etc
   */
  run(operation: Operation, scopeId?: string, formParameters?: { [key: string]: string }) {
    const loggedUser = ((this.dataForUiHolder.dataForUi || {}).auth || {}).user;
    if (!loggedUser) {
      return;
    }
    if (this.canRunDirectly(operation)) {
      const asDownload = operation.resultType === OperationResultTypeEnum.FILE_DOWNLOAD;
      // Run the operation right now
      let request: Observable<HttpResponse<any>>;
      const params: any = {
        operation: operation.id,
        body: { formParameters: formParameters }
      };
      switch (operation.scope) {
        case OperationScopeEnum.USER:
          params.owner = scopeId || loggedUser.id;
          request = asDownload
            ? this.operationsService.runOwnerOperation$Any$Response(params)
            : this.operationsService.runOwnerOperation$Json$Response(params);
          break;
        case OperationScopeEnum.SYSTEM:
        case OperationScopeEnum.INTERNAL:
        case OperationScopeEnum.MENU:
          request = asDownload
            ? this.operationsService.runOperation$Any$Response(params)
            : this.operationsService.runOperation$Json$Response(params);
          break;
        case OperationScopeEnum.ADVERTISEMENT:
          params.ad = scopeId;
          request = asDownload
            ? this.operationsService.runAdOperation$Any$Response(params)
            : this.operationsService.runAdOperation$Json$Response(params);
          break;
      }
      if (request) {
        request.pipe(first()).subscribe(response => this.handleResult(response));
      }
    } else {
      // Go to the run page
      const parts = ['operations'];
      switch (operation.scope) {
        case OperationScopeEnum.USER:
          if (!scopeId || scopeId === loggedUser.id) {
            parts.push('self');
          } else {
            parts.push('user', scopeId);
          }
          break;
        case OperationScopeEnum.SYSTEM:
          parts.push('system');
          break;
        case OperationScopeEnum.ADVERTISEMENT:
          parts.push('marketplace', scopeId);
          break;
        case OperationScopeEnum.INTERNAL:
        case OperationScopeEnum.MENU:
          parts.push('action');
          break;
      }
      parts.push(ApiHelper.internalNameOrId(operation));
      this.router.navigate(parts, {
        queryParams: formParameters
      });
    }
  }

  /**
   * Can the given action be executed directly from another page, without going to the run operation page?
   * @param operation The operation
   * @param onlyTypesThatCanRunOnHostPage If true (the default) will only return true if the operation can be
   *   executed directly in another page, such as download, notification, url and external redirect.
   *   If set to false, just check the operation parameters.
   */
  canRunDirectly(operation: Operation, onlyTypesThatCanRunOnHostPage = true) {
    if (onlyTypesThatCanRunOnHostPage && !TypesRunDirectly.includes(operation.resultType)) {
      return false;
    }
    // Cannot run if there is file upload, of if has confirmation password or confirmation text
    if (operation.hasFileUpload || operation.requireConfirmationPassword || !empty(operation.confirmationText)) {
      return false;
    }
    if (operation.resultType === OperationResultTypeEnum.RESULT_PAGE) {
      // A result page will only reach so far if onlyTypesThatCanRunOnHostPage === false.
      // In this case, assume that operation is a OperationDataForRun already
      return (operation as OperationDataForRun).searchAutomatically;
    } else {
      // Can run directly if there's no missing parameter
      return empty(operation.missingRequiredParameters)
        && (!operation.showFormForMissingOptionalParameters || empty(operation.missingOptionalParameters));
    }
  }

  /**
   * Returns a heading action suitable to run the given custom operation
   */
  headingAction(operation: Operation, scopeId: string, formParameters?: { [key: string]: string }): HeadingAction {
    return new HeadingAction('chevron_right', operation.label, () => this.run(operation, scopeId, formParameters));
  }

  /**
   * Handles the response for the following result type:
   *
   * - File downloads
   * - Notification
   * - Url / external redirect
   *
   * Also handles automatic actions on the result, such as:
   *
   * - Auto execute an action
   * - Go back to a previous custom operation in the stack
   * - Go back to the root page, that is, the one before any custom operation
   *
   * @param response The response
   * @returns Whether the response was handled or not
   */
  handleResult(response: HttpResponse<any>): boolean {
    if (response.body instanceof Blob) {
      downloadResponse(response);
      return true;
    }
    // According to TypesRunDirectly, can only be notification, URL or external redirect
    const result = response.body as RunOperationResult;
    let handled = false;
    switch (result.resultType) {
      case OperationResultTypeEnum.NOTIFICATION:
        // Show the notification
        switch (result.notificationLevel || NotificationLevelEnum.INFORMATION) {
          case NotificationLevelEnum.INFORMATION:
            this.notification.info(result.notification);
            handled = true;
            break;
          case NotificationLevelEnum.WARNING:
            this.notification.warning(result.notification);
            handled = true;
            break;
          case NotificationLevelEnum.ERROR:
            this.notification.error(result.notification);
            handled = true;
            break;
        }
        break;
      case OperationResultTypeEnum.URL:
        // Open the URL in a new window
        window.open(result.url);
        handled = true;
        break;
      case OperationResultTypeEnum.EXTERNAL_REDIRECT:
        // Replace the current location with the external redirect URL
        location.href = result.url;
        handled = true;
        break;
    }

    // Check if we need to go back to a previous custom operation
    const backTo = ApiHelper.internalNameOrId(result.backTo);
    if (backTo) {
      // We need to go back to a previous custom operation
      const paths = this.breadcrumb.breadcrumb$.value;
      for (const path of paths) {
        if (path.startsWith('/operations/') && path.includes('/' + backTo)) {
          // Found the operation where to return to
          this.doNavigate(path);
          return true;
        }
      }
    }

    // Check if we need to go back to the url before all custom operations
    if (result.backToRoot) {
      // We need to go back to the first page which is not run a custom operation
      const paths = this.breadcrumb.breadcrumb$.value;
      for (let i = paths.length - 1; i >= 0; i--) {
        const path = paths[i];
        if (!path.startsWith('/operations/')) {
          // Found the page where to return to
          this.doNavigate(path);
          return true;
        }
      }
      // Still needs to go back to home
      this.doNavigate('/home');
    }

    // If there is some action that needs to be executed immediately, do it
    const autoRunAction = (result.actions || []).find(a => a.action.id === result.autoRunActionId);
    if (autoRunAction) {
      // Run the action and leave
      this.run(autoRunAction.action, null, autoRunAction.parameters);
      return true;
    }

    return handled;
  }

  private doNavigate(path: string) {
    const url = new URL(path, location.href);
    const params: Params = {};
    url.searchParams.forEach((value, name) => params[name] = value);
    this.router.navigate([url.pathname], {
      queryParams: params
    });
  }
}
