import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import {
  DeviceConfirmationTypeEnum,
  ExportFormat, NotificationLevelEnum, Operation, OperationDataForRun,
  OperationResultTypeEnum, OperationScopeEnum, OperationShowFormEnum, RunOperation, RunOperationResult
} from 'app/api/models';
import { OperationsService } from 'app/api/services/operations.service';
import { ConfirmationService } from 'app/core/confirmation.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { downloadResponse, empty } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { OperationHelperService } from 'app/ui/core/operation-helper.service';
import { PageData } from 'app/ui/shared/page-data';
import { cloneDeep } from 'lodash-es';
import { Observable } from 'rxjs';

/**
 * Types which can run actions directly without going to the run page
 */
const TypesRunDirectly: OperationResultTypeEnum[] = [
  OperationResultTypeEnum.NOTIFICATION,
  OperationResultTypeEnum.FILE_DOWNLOAD,
  OperationResultTypeEnum.URL,
  OperationResultTypeEnum.EXTERNAL_REDIRECT,
];

/**
 * Helper for registering known operations and running them
 */
@Injectable({
  providedIn: 'root',
})
export class RunOperationHelperService {

  /** The next action that can be executed. */
  reRun = false;

  constructor(
    private dataForFrontendHolder: DataForFrontendHolder,
    private notification: NotificationService,
    private breadcrumb: BreadcrumbService,
    private router: Router,
    private operationHelper: OperationHelperService,
    private operationsService: OperationsService,
    private nextRequestState: NextRequestState,
    private confirmation: ConfirmationService) {
  }

  /**
   * If the operation can be executed directly, run it.
   * Otherwise, go to the run action page for the given operation.
   * @param operation The operation to run
   * @param scopeId The id of the scoping entity, such as user, advertisement, etc
   */
  run(operation: Operation, scopeId?: string, formParameters?: { [key: string]: string; }) {
    const loggedUser = this.dataForFrontendHolder.user;
    if (!loggedUser) {
      return;
    }
    if (this.canRunDirectly(operation)) {
      // Run the operation right now
      var doRun = (confirmationPassword?: string) => this.runRequest(operation, {
        scopeId,
        formParameters,
        confirmationPassword
      }).subscribe(response => this.handleResult(response));

      if (operation.requireConfirmationPassword) {
        // Get the run data in order to get the password input
        const createDeviceConfirmation = () => ({
          type: DeviceConfirmationTypeEnum.RUN_OPERATION,
          operation: operation.id,
        });
        this.getDataForRunRequest(operation, scopeId).subscribe(data => {
          if (data.confirmationPasswordInput) {
            this.confirmation.confirm({
              callback: conf => {
                this.confirmation.hide();
                doRun(conf.confirmationPassword);
              },
              createDeviceConfirmation,
              message: data.confirmationText,
              passwordInput: data.confirmationPasswordInput
            });
          }
        });
      } else if (operation.confirmationText) {
        this.confirmation.confirm({
          callback: () => {
            this.confirmation.hide();
            doRun();
          },
          message: operation.confirmationText,
        });
      } else {
        doRun();
      }
    } else {
      // Go to the run page
      const parts = ['/operations'];
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
        case OperationScopeEnum.RECORD:
          parts.push('record', scopeId);
          break;
        case OperationScopeEnum.TRANSFER:
          parts.push('transfer', scopeId);
          break;
        case OperationScopeEnum.INTERNAL:
        case OperationScopeEnum.MENU:
          parts.push('action');
          break;
      }
      parts.push(ApiHelper.internalNameOrId(operation));
      this.router.navigate(parts, {
        queryParams: formParameters,
      });
    }
  }

  /**
   * Returns the request to run the given custom operation
   */
  runRequest(operation: Operation, options: {
    scopeId?: string,
    confirmationPassword?: string,
    scannedQrCode?: string,
    formParameters?: { [key: string]: string; },
    pageData?: PageData,
    upload?: Blob,
    exportFormat?: ExportFormat;
  }): Observable<HttpResponse<any>> {

    // The request body (RunOperation)
    const run: RunOperation = {};
    run.formParameters = options.formParameters;
    run.confirmationPassword = options.confirmationPassword;
    run.scannedQrCode = options.scannedQrCode;
    if (options.pageData) {
      run.page = options.pageData.page;
      run.pageSize = options.pageData.pageSize;
    }
    if (options.exportFormat) {
      run.exportFormat = options.exportFormat.internalName;
    }

    // If asDownload, request the blob version
    const asDownload = operation.resultType === OperationResultTypeEnum.FILE_DOWNLOAD || options.exportFormat;

    // The parameters (still needs the owner parameter)
    const params: any = {
      operation: operation.id,
      body: {
        params: run,
        file: options.upload,
      },
    };

    const scopeId = options.scopeId;

    switch (operation.scope) {
      case OperationScopeEnum.USER:
        // Over a user
        params.owner = scopeId || ApiHelper.SELF;
        return asDownload
          ? this.operationsService.runOwnerOperationWithUpload$Any$Response(params)
          : this.operationsService.runOwnerOperationWithUpload$Response(params);
      case OperationScopeEnum.ADVERTISEMENT:
        // Over an advertisement
        params.ad = scopeId;
        return asDownload
          ? this.operationsService.runAdOperationWithUpload$Any$Response(params)
          : this.operationsService.runAdOperationWithUpload$Response(params);
      case OperationScopeEnum.RECORD:
        // Over a record
        params.id = scopeId;
        return asDownload
          ? this.operationsService.runRecordOperationWithUpload$Any$Response(params)
          : this.operationsService.runRecordOperationWithUpload$Response(params);
      case OperationScopeEnum.TRANSFER:
        // Over a transfer
        params.key = scopeId;
        return asDownload
          ? this.operationsService.runTransferOperationWithUpload$Any$Response(params)
          : this.operationsService.runTransferOperationWithUpload$Response(params);
      case OperationScopeEnum.MENU:
        // Over a menu item
        params.menu = scopeId;
        return asDownload
          ? this.operationsService.runMenuOperationWithUpload$Any$Response(params)
          : this.operationsService.runMenuOperationWithUpload$Response(params);
      default:
        // No additional context (system, internal action, ...)
        return asDownload
          ? this.operationsService.runOperationWithUpload$Any$Response(params)
          : this.operationsService.runOperationWithUpload$Response(params);
    }
  }

  /**
   * Returns the request to get data for running the given custom operation
   */
  getDataForRunRequest(operation: Operation, scopeId?: string): Observable<OperationDataForRun> {
    switch (operation.scope) {
      case OperationScopeEnum.USER:
        // Over a user
        return this.operationsService.getOwnerOperationDataForRun({
          operation: operation.id, owner: scopeId
        });
      case OperationScopeEnum.ADVERTISEMENT:
        // Over an advertisement
        return this.operationsService.getOwnerOperationDataForRun({
          operation: operation.id, owner: scopeId
        });
      case OperationScopeEnum.RECORD:
        // Over a record
        return this.operationsService.getRecordOperationDataForRun({
          operation: operation.id, id: scopeId
        });
      case OperationScopeEnum.TRANSFER:
        // Over a transfer
        return this.operationsService.getTransferOperationDataForRun({
          operation: operation.id, key: scopeId
        });
      case OperationScopeEnum.MENU:
        // Over a menu item
        return this.operationsService.getMenuOperationDataForRun({
          menu: scopeId
        });
      default:
        // No additional context (system, internal action, ...)
        return this.operationsService.getOperationDataForRun({
          operation: operation.id
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
    // Cannot run if there is QR-code scan or file upload
    if (operation.submitWithQrCodeScan || operation.hasFileUpload) {
      return false;
    }
    if (operation.resultType === OperationResultTypeEnum.RESULT_PAGE) {
      // A result page will only reach so far if onlyTypesThatCanRunOnHostPage === false.
      // In this case, assume that operation is a OperationDataForRun already
      return (operation as OperationDataForRun).searchAutomatically;
    } else {
      if (operation.showForm) {
        switch (operation.showForm) {
          case OperationShowFormEnum.ALWAYS:
            return false;
          case OperationShowFormEnum.MISSING_REQUIRED:
            return empty(operation.missingRequiredParameters);
          case OperationShowFormEnum.MISSING_ANY:
            return empty(operation.missingRequiredParameters) && empty(operation.missingOptionalParameters);
        }
      } else {
        // Can run directly if there's no missing parameter
        return empty(operation.missingRequiredParameters) && empty(operation.missingOptionalParameters);
      }
    }
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
        this.nextRequestState.leaveNotification = true;
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

    this.reRun = result.reRun;

    // Check if we need to go back to a previous custom operation or go back to the url before all custom operations
    const backTo = ApiHelper.internalNameOrId(result.backTo);
    if (backTo || result.backToRoot) {
      const pathCondition = backTo ?
        // We need to go back to a previous custom operation
        path => path.startsWith('/operations/') && path.includes('/' + backTo) :
        // We need to go back to the first page which is not a custom operation
        path => !path.startsWith('/operations/');
      const index = cloneDeep(this.breadcrumb.breadcrumb$.value).reverse().findIndex(pathCondition);
      if (index > 0) {
        this.breadcrumb.back(index);
        return true;
      }
      if (result.backToRoot) {
        // Still needs to go back to home
        this.doNavigate('/home');
        return true;
      }
    }

    if (this.reRun) {
      this.doNavigate(this.breadcrumb.breadcrumb$.value.pop(), true);
      return true;
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

  /**
   * Returns a heading action suitable to run the given custom operation
   */
  headingAction(operation: Operation, scopeId: string, formParameters?: { [key: string]: string; }): HeadingAction {
    return new HeadingAction(this.operationHelper.icon(operation), operation.label, () => this.run(operation, scopeId, formParameters));
  }

  private doNavigate(path: string, replaceUrl = false) {
    const url = new URL(path, location.href);
    const params: Params = {};
    url.searchParams.forEach((value, name) => params[name] = value);
    this.router.navigate([url.pathname], {
      queryParams: params,
      replaceUrl
    });
  }
}
