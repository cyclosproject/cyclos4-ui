import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Params } from '@angular/router';
import {
  CreateDeviceConfirmation, Currency, CustomFieldDetailed, DeviceConfirmationTypeEnum,
  ExportFormat, OperationDataForRun, OperationResultTypeEnum,
  OperationRowActionEnum, OperationScopeEnum, RunOperationAction, RunOperationResult, RunOperationResultColumn, RunOperationResultColumnTypeEnum
} from 'app/api/models';
import { OperationsService } from 'app/api/services/operations.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { PagedResults } from 'app/shared/paged-results';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { OperationHelperService } from 'app/ui/core/operation-helper.service';
import { RunOperationHelperService } from 'app/ui/core/run-operation-helper.service';
import { OperationRunScope } from 'app/ui/operations/operation-run-scope';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { PageData } from 'app/ui/shared/page-data';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, first, tap } from 'rxjs/operators';

/**
 * Runs a custom operation
 */
@Component({
  selector: 'run-operation',
  templateUrl: 'run-operation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunOperationComponent
  extends BasePageComponent<OperationDataForRun>
  implements OnInit {

  /** The scope is only set when not running over own user */
  runScope: OperationRunScope;
  userParam: string;
  self: boolean;
  scopeId: string;
  form: FormGroup;
  fileControl: FormControl;
  result$ = new BehaviorSubject<RunOperationResult>(null);
  pageResults$ = new BehaviorSubject<PagedResults<any>>(null);
  redirecting$ = new BehaviorSubject(false);
  pageData: PageData;
  formFields: CustomFieldDetailed[];
  isSearch: boolean;
  isContent: boolean;
  runDirectly: boolean;
  hasSearchFields: boolean;
  leaveNotification: boolean;
  alreadyExecuted: boolean;
  closeTimer: any;
  primaryActions: RunOperationAction[];
  private createDeviceConfirmation: () => CreateDeviceConfirmation;

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
    private runOperationHelper: RunOperationHelperService,
    private nextRequestState: NextRequestState,
    private operationsService: OperationsService,
    private modal: BsModalService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.runScope = route.data.runScope;
    this.userParam = route.params.user;

    if (!this.runScope) {
      throw new Error(`No runScope on ${route.url}`);
    }

    const params: any = {
      operation: route.params.operation,
    };

    this.createDeviceConfirmation = () => ({
      type: DeviceConfirmationTypeEnum.RUN_OPERATION,
      operation: this.data.id,
    });

    let request: Observable<OperationDataForRun>;
    switch (this.runScope) {
      case OperationRunScope.User:
        // Either another user or the logged user
        this.scopeId = params.owner = route.params.user || this.login.user.id;
        request = this.operationsService.getOwnerOperationDataForRun(params);
        break;

      case OperationRunScope.Ad:
        // An advertisement
        this.scopeId = params.ad = route.params.ad;
        request = this.operationsService.getAdOperationDataForRun(params);
        break;

      case OperationRunScope.Record:
        // A record
        this.scopeId = params.id = route.params.record;
        request = this.operationsService.getRecordOperationDataForRun(params);
        break;

      case OperationRunScope.Transfer:
        // A transfer
        this.scopeId = params.key = route.params.transfer;
        request = this.operationsService.getTransferOperationDataForRun(params);
        break;

      case OperationRunScope.Menu:
        // A custom menu item
        this.scopeId = params.menu = route.params.menu;
        request = this.operationsService.getMenuOperationDataForRun(params);
        break;

      default:
        // Standalone (system or internal action)
        request = this.operationsService.getOperationDataForRun(params);
        break;
    }

    // Perform the request to get the run data
    this.nextRequestState.queryParams = route.queryParams;
    this.leaveNotification = this.nextRequestState.leaveNotification;
    this.addSub(request.subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: OperationDataForRun) {
    if (this.runScope === OperationRunScope.User) {
      this.self = this.authHelper.isSelf(data.user);
    }

    if (data.scope === OperationScopeEnum.INTERNAL &&
      data.id !== this.runOperationHelper.nextAction && data.internalName !== this.runOperationHelper.nextAction) {
      // This action has already been executed, this is probably a page refresh
      this.alreadyExecuted = true;
      return;
    }

    this.isSearch = data.resultType === OperationResultTypeEnum.RESULT_PAGE;
    this.isContent = [OperationResultTypeEnum.PLAIN_TEXT, OperationResultTypeEnum.RICH_TEXT].includes(data.resultType);
    const formFields = data.formParameters || [];
    this.form = this.fieldsHelper.customValuesFormGroup(formFields);
    this.fileControl = this.formBuilder.control(null);
    this.runDirectly = this.runOperationHelper.canRunDirectly(data, false);
    this.hasSearchFields = formFields.length > 0 || data.hasFileUpload;

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
      this.pageData = {
        page: 0,
        pageSize: this.uiLayout.searchPageSize,
      };
    }

    // Register the row action, if any
    this.operationHelper.register(data.rowOperation);

    // Heading actions
    this.addHeadingActions(data, data.actions);

    // Maybe the operation will be executed directly
    if (this.runDirectly) {
      this.nextRequestState.leaveNotification = this.leaveNotification;
      if (this.isSearch) {
        // When running searches directly, whenever some filter changes, re-run in page 0
        this.addSub(this.form.valueChanges.pipe(debounceTime(ApiHelper.DEBOUNCE_TIME)).subscribe(() => {
          this.pageData.page = 0;
          this.run(data);
        }));
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
    if (data.submitWithQrCodeScan) {
      const ref = this.modal.show(ScanQrCodeComponent, {
        class: 'modal-form',
      });
      const component = ref.content as ScanQrCodeComponent;
      component.select.pipe(first()).subscribe(value => this.confirmAndRun(data, value));
    } else {
      this.confirmAndRun(data);
    }
  }

  private confirmAndRun(data: OperationDataForRun, scannedQrCode?: string) {
    if (!empty(data.confirmationText) || data.confirmationPasswordInput) {
      this.confirmation.confirm({
        title: data.name,
        message: data.confirmationText,
        createDeviceConfirmation: this.createDeviceConfirmation,
        passwordInput: data.confirmationPasswordInput,
        callback: conf => this.doRun(data, {
          confirmationPassword: conf.confirmationPassword,
          scannedQrCode
        }),
      });
    } else {
      this.doRun(data, {
        scannedQrCode
      });
    }
  }

  updatePage(data: PageData) {
    this.pageData = data;
    this.run();
  }

  get runAction() {
    return () => this.run();
  }

  private doRun(data: OperationDataForRun, params?: {
    confirmationPassword?: string,
    scannedQrCode?: string,
    exportFormat?: ExportFormat;
  }) {
    params = params || {};
    // Get the request from OperationHelperService
    const request = this.runOperationHelper.runRequest(data, {
      scopeId: this.scopeId,
      confirmationPassword: params.confirmationPassword,
      scannedQrCode: params.scannedQrCode,
      formParameters: this.form.value,
      exportFormat: params.exportFormat,
      pageData: this.pageData,
      upload: this.fileControl.value
    });

    // Append the query parameters
    const route = this.route.snapshot;
    this.nextRequestState.queryParams = route.queryParams;

    // Perform the request. If there's any error, clear the redirecting flag
    this.addSub(request.pipe(first(), tap(r => r, () => this.redirecting$.next(false)))
      .subscribe(response => this.afterRun(response)));

    // When an external redirect, set the redirecting flag, so a message is show to the user
    this.redirecting$.next(data.resultType === OperationResultTypeEnum.EXTERNAL_REDIRECT);
  }

  private afterRun(response: HttpResponse<any>) {
    const handled = this.runOperationHelper.handleResult(response);
    if (handled) {
      // Already handled (download / notification / url / redirect)
      return;
    }

    // At this point the response is not a blob
    const result = response.body as RunOperationResult;

    // Store the result
    this.result$.next(result);

    // If there's a timeout for closing the result, apply it
    if (this.isContent && this.data.closeAfterSeconds != null) {
      this.closeTimer = setTimeout(() => this.reload(), this.data.closeAfterSeconds * 1000);
    }

    // Heading actions
    this.addHeadingActions(this.data, result.actions);

    if (this.isSearch) {
      // Get the results page from the response
      const paged = new PagedResults(result.rows);
      PagedResults.fillHeaders(paged, response);
      this.pageResults$.next(paged);
    }
  }

  reload() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    super.reload();
  }

  private addHeadingActions(data: OperationDataForRun, actions: RunOperationAction[]) {
    const headingActions: HeadingAction[] = [];
    if (data.allowPrint && this.isContent) {
      headingActions.push(this.exportHelper.printAction());
    } else if (!empty(data.exportFormats)) {
      this.exportHelper.headingActions(data.exportFormats, f =>
        this.runOperationHelper.runRequest(data, {
          scopeId: this.scopeId,
          formParameters: this.form.value,
          pageData: this.pageData,
          upload: this.fileControl.value,
          exportFormat: f
        })).forEach(a => headingActions.push(a));
    }
    this.primaryActions = [];
    for (const action of actions || []) {
      // Register each custom operation action
      const op = action.action;
      if (op) {
        if (action.primary) {
          this.primaryActions.push(action);
        } else {
          this.operationHelper.register(op);
          headingActions.push(new HeadingAction(this.operationHelper.icon(op), op.label, () => {
            this.runOperationHelper.run(op, null, action.parameters);
          }));
        }
      }
    }
    if (headingActions.length === 1) {
      headingActions[0].maybeRoot = true;
    }
    this.headingActions = headingActions;
  }

  runPrimaryAction(action: RunOperationAction) {
    this.runOperationHelper.run(action.action, null, action.parameters);
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
        this.runOperationHelper.nextAction = operation.id;
        this.router.navigate(['/operations', 'action', ApiHelper.internalNameOrId(operation)], {
          queryParams: params,
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

  get onClick() {
    return (row: any) => this.rowClick(row);
  }

  formatCell(value: any, col: RunOperationResultColumn): string {
    switch (col.type) {
      case RunOperationResultColumnTypeEnum.BOOLEAN:
        return this.format.formatBoolean(value);
      case RunOperationResultColumnTypeEnum.DATE:
        return this.format.formatAsDate(value);
      case RunOperationResultColumnTypeEnum.NUMBER:
        return this.format.formatAsNumber(value, col.decimalDigits);
      case RunOperationResultColumnTypeEnum.CURRENCY_AMOUNT:
        if (value && typeof value === 'object') {
          const ca = value as { amount: any, currency: Currency; };
          return this.format.formatAsCurrency(ca.currency, ca.amount);
        }
    }
    return String(value);
  }

  resolveMenu(data: OperationDataForRun) {
    if (data.scope === OperationScopeEnum.SYSTEM
      || (data.scope === OperationScopeEnum.USER) && this.self) {
      // This is an owner operation
      return new ActiveMenu(this.menu.menuForOwnerOperation(data), { operation: data });
    } else {
      // The menu depends on the operation scope
      switch (this.runScope) {
        case OperationRunScope.User:
          return this.menu.userMenu(data.user, Menu.MY_PROFILE);
        case OperationRunScope.Ad:
          return this.menu.userMenu(data.user, Menu.SEARCH_ADS);
        case OperationRunScope.Record:
          return this.authHelper.isSelf(data.user) ? this.menu.menuForRecordType(data.user, data.recordType) :
            this.menu.userMenu(data.user, Menu.SEARCH_USERS);
        case OperationRunScope.Transfer:
          return this.menu.transferMenu(data.transfer);
        case OperationRunScope.Menu:
          const entry = this.menu.contentPageEntry(ApiHelper.internalNameOrId(data.menuItem));
          return entry?.activeMenu;
        case OperationRunScope.Standalone:
          // There's no info
          return null;
      }
    }
  }
}
