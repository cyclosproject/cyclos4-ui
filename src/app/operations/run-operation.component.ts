import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Params } from '@angular/router';
import {
  CustomFieldDetailed, OperationDataForRun, OperationResultTypeEnum,
  OperationRowActionEnum, RunOperation, RunOperationResult
} from 'app/api/models';
import { OperationsService } from 'app/api/services/operations.service';
import { Configuration } from 'app/configuration';
import { FieldHelperService } from 'app/core/field-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { OperationRunScope } from 'app/operations/operation-run-scope';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { PageData } from 'app/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { BehaviorSubject, Observable } from 'rxjs';
import { first, tap } from 'rxjs/operators';

/**
 * Runs a custom operation
 */
@Component({
  selector: 'run-operation',
  templateUrl: 'run-operation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunOperationComponent
  extends BasePageComponent<OperationDataForRun>
  implements OnInit {

  /** The scope is only set when not running over own user */
  runScope: OperationRunScope;
  form: FormGroup;
  fileControl: FormControl;
  result$ = new BehaviorSubject<RunOperationResult>(null);
  pageResults$ = new BehaviorSubject<PagedResults<any>>(null);
  redirecting$ = new BehaviorSubject(false);
  pageData: PageData = { page: 0, pageSize: Configuration.defaultPageSize };
  formFields: CustomFieldDetailed[];
  isSearch: boolean;
  isContent: boolean;
  runDirectly: boolean;

  get result(): RunOperationResult {
    return this.result$.value;
  }

  get pageResults(): PagedResults<any> {
    return this.pageResults$.value;
  }

  constructor(
    injector: Injector,
    private fieldsHelper: FieldHelperService,
    private operationHelper: OperationHelperService,
    private nextRequestState: NextRequestState,
    private operationsService: OperationsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    const routeData = route.data;
    this.runScope = routeData.runScope;
    if (!this.runScope) {
      throw new Error(`No runScope on ${route.url}`);
    }

    const params: any = {
      operation: route.params.operation
    };

    let request: Observable<OperationDataForRun>;
    switch (this.runScope) {
      case OperationRunScope.User:
        // Either another user or the logged user
        params.owner = route.params.user || this.login.user.id;
        request = this.operationsService.getOwnerOperationDataForRun(params);
        break;

      case OperationRunScope.Ad:
        // An advertisement
        params.ad = route.params.ad;
        request = this.operationsService.getAdOperationDataForRun(params);
        break;

      case OperationRunScope.Transfer:
        // A transfer
        params.key = route.params.transfer;
        request = this.operationsService.getTransferOperationDataForRun(params);
        break;

      default:
        // Standalone (system or internal action)
        request = this.operationsService.getOperationDataForRun(params);
        break;
    }

    // Perform the request to get the run data
    this.nextRequestState.queryParams = route.queryParams;
    request.subscribe(data => {
      this.data = data;
    });
  }

  onDataInitialized(data: OperationDataForRun) {
    this.isSearch = data.resultType === OperationResultTypeEnum.RESULT_PAGE;
    this.isContent = [OperationResultTypeEnum.PLAIN_TEXT, OperationResultTypeEnum.RICH_TEXT].includes(data.resultType);
    const formFields = data.formParameters || [];
    this.form = this.fieldsHelper.customValuesFormGroup(formFields);
    if (data.hasFileUpload) {
      this.fileControl = this.formBuilder.control(null);
    }
    this.runDirectly = this.operationHelper.canRunDirectly(data, false);

    if (formFields.length > 0) {
      const queryParams = this.route.snapshot.queryParamMap;
      this.formFields = [];
      for (const field of formFields) {
        const value = queryParams.get(field.internalName);
        if (empty(value)) {
          // There's no fixed value for this field.
          this.formFields.push(field);
        } else {
          // There's a fixed value for this field: store it on the form
          const patch: any = {};
          patch[field.internalName] = value;
          this.form.patchValue(patch, { emitEvent: false });
        }
      }
    }

    if (this.isSearch) {
      // When a search, manage the form state, so on back, the same filters are kept
      this.stateManager.manage(this.form);
    }

    // Register the row action, if any
    this.operationHelper.register(data.rowOperation);

    // Maybe the operation will be executed directly
    if (this.runDirectly) {
      if (this.isSearch) {
        // When running searches directly, whenever some filter changes, re-run
        this.addSub(this.form.valueChanges.subscribe(() => this.run(data)));
      }
      // Run the operation
      this.run(data);
    }
  }

  /** Execute the custom operation */
  run(data?: OperationDataForRun) {
    if (!data) {
      data = this.data;
      if (!data) {
        // No data to run!!!
        return;
      }
    }
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    if (!empty(data.confirmationText) || data.confirmationPasswordInput) {
      this.notification.confirm({
        title: data.name,
        message: data.confirmationText,
        passwordInput: data.confirmationPasswordInput,
        callback: conf => this.doRun(data, conf.confirmationPassword)
      });
    } else {
      this.doRun(data, null);
    }
  }

  updatePage(data: PageData) {
    this.pageData = data;
    this.run();
  }

  private doRun(data: OperationDataForRun, confirmationPassword: string) {
    const route = this.route.snapshot;

    // The request body (RunOperation)
    const run: RunOperation = {};
    run.formParameters = this.form.value;
    run.confirmationPassword = confirmationPassword;
    if (this.pageData) {
      run.page = this.pageData.page;
      run.pageSize = this.pageData.pageSize;
    }

    // If asDownload, request the blob version
    const asDownload = data.resultType === OperationResultTypeEnum.FILE_DOWNLOAD;
    const upload = this.fileControl.value as File;

    // The parameters (still needs the owner parameter)
    const params: any = {
      operation: data.id,
      body: {
        params: run,
        file: upload
      }
    };
    if (upload) {
      // Will use the upload variant
    }

    let request: Observable<HttpResponse<any>>;
    switch (this.runScope) {
      case OperationRunScope.User:
        // A user (maybe also the logged user)
        params.owner = route.params.user || ApiHelper.SELF;
        request = asDownload
          ? this.operationsService.runOwnerOperationWithUpload$Any$Response(params)
          : this.operationsService.runOwnerOperationWithUpload$Json$Response(params);
        break;

      case OperationRunScope.Ad:
        // An advertisement
        params.ad = route.paramMap.get('ad');
        request = asDownload
          ? this.operationsService.runAdOperationWithUpload$Any$Response(params)
          : this.operationsService.runAdOperationWithUpload$Json$Response(params);
        break;

      case OperationRunScope.Transfer:
        // A transfer
        params.key = route.paramMap.get('transfer');
        request = asDownload
          ? this.operationsService.runTransferOperationWithUpload$Any$Response(params)
          : this.operationsService.runTransferOperationWithUpload$Json$Response(params);
        break;

      default:
        // Standalone (system or internal action)
        request = asDownload
          ? this.operationsService.runOperationWithUpload$Any$Response(params)
          : this.operationsService.runOperationWithUpload$Json$Response(params);
        break;
    }

    // Append the query parameters
    this.nextRequestState.queryParams = route.queryParams;

    // Perform the request. If there's any error, clear the redirecting flag
    request.pipe(first(), tap(r => r, () => this.redirecting$.next(false)))
      .subscribe(response => this.afterRun(response));

    // When an external redirect, set the redirecting flag, so a message is show to the user
    this.redirecting$.next(data.resultType === OperationResultTypeEnum.EXTERNAL_REDIRECT);
  }

  private afterRun(response: HttpResponse<any>) {
    const handled = this.operationHelper.handleResult(response);
    if (handled) {
      // Already handled (download / notification / url / redirect)
      return;
    }

    // At this point the response is not a blob
    const result = response.body as RunOperationResult;

    // Store the result
    this.result$.next(result);

    // Heading actions
    const headingActions: HeadingAction[] = [];
    if (this.data.allowPrint && (this.isSearch || this.isContent)) {
      headingActions.push(this.printAction);
    }
    for (const action of result.actions || []) {
      // Register each custom operation action
      const op = action.action;
      if (op) {
        this.operationHelper.register(op);
        headingActions.push(new HeadingAction('chevron_right', op.label, () => {
          this.operationHelper.run(op, null, action.parameters);
        }));
      }
    }
    this.headingActions = headingActions;

    if (this.isSearch) {
      // Get the results page from the response
      const paged = new PagedResults(result.rows);
      PagedResults.fillHeaders(paged, response);
      this.pageResults$.next(paged);
    }
  }

  /** Handle the row action */
  rowClick(row: any) {
    const data = this.data;
    const action = data.rowAction;
    const params: Params = {};
    (data.rowParameters || []).forEach(p => params[p] = row[p]);

    switch (action) {
      case OperationRowActionEnum.OPERATION:
        const operation = data.rowOperation;
        this.menu.setActiveActionOperation(operation);
        this.router.navigate(['operations', 'action', ApiHelper.internalNameOrId(operation)], {
          queryParams: params
        });
        break;
      case OperationRowActionEnum.URL:
        let url = data.rowUrl;
        for (const name of Object.keys(params)) {
          const value = params[name];
          if (value) {
            url += url.includes('?') ? '&' : '?';
            url += encodeURIComponent(name) + '=' + encodeURIComponent(value);
          }
        }
        // Open the URL in another browser window
        window.open(url);
        break;
      case OperationRowActionEnum.LOCATION:
        const dest = ApiHelper.urlForLocation(data.rowLocation, params.id);
        if (dest) {
          this.router.navigateByUrl(dest);
        }
        break;
    }
  }
}
