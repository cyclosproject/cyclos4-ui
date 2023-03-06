import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { CreateDeviceConfirmation, DeviceConfirmationTypeEnum, GeneralImportedFileKind, ImportedFileDataForNew, ImportedFileKind, ImportedFileNew, UserImportedFileKind, VoucherTypeDetailed } from 'app/api/models';
import { ImportsService } from 'app/api/services/imports.service';
import { ApiHelper } from 'app/shared/api-helper';
import { validateBeforeSubmit } from 'app/shared/helper';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { BehaviorSubject, Observable } from 'rxjs';

export type ImportStep = 'voucher-type' | 'form';

/** Validates that the group is required if useGroupFromFile is false */
const GROUP_VALIDATOR: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const useGroupFromFile = !!parent.get('useGroupFromFile').value;
    if (!useGroupFromFile) {
      return Validators.required(control);
    }
  }
  return null;
};

/** Validates that the amount is required if useAmountFromFile is false */
const AMOUNT_VALIDATOR: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const useAmountFromFile = !!parent.get('useAmountFromFile').value;
    if (!useAmountFromFile) {
      return Validators.required(control);
    }
  }
  return null;
};

/**
 * Imports a new file
 */
@Component({
  selector: 'import-file',
  templateUrl: 'import-file.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFileComponent extends BasePageComponent<ImportedFileDataForNew> implements OnInit {

  ImportedFileKind = ImportedFileKind;

  generalKind: GeneralImportedFileKind;
  user: string;
  userKind: UserImportedFileKind;

  isSelf: boolean;

  form: FormGroup;
  confirmationPasswordControl: FormControl;
  fileControl: FormControl;

  step$ = new BehaviorSubject<ImportStep>(null);
  voucherType$ = new BehaviorSubject<VoucherTypeDetailed>(null);
  useAmountFromFile$ = new BehaviorSubject(false);

  showSubmit$ = new BehaviorSubject(true);

  constructor(
    injector: Injector,
    private importsService: ImportsService,
    public importsHelper: ImportsHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const route = this.route.snapshot;
    const owner = route.params.owner;

    let request: Observable<ImportedFileDataForNew>;
    if (ApiHelper.SYSTEM === owner) {
      this.generalKind = route.params.kind;
      request = this.importsService.getGeneralImportedFileDataForNew({
        kind: this.generalKind
      });
    } else {
      this.userKind = route.params.kind;
      this.user = owner;
      request = this.importsService.getUserImportedFileDataForNew({
        user: this.user,
        kind: this.userKind
      });
    }
    this.stateManager.cache('data', request).subscribe(data => this.data = data);
  }

  onDataInitialized(data: ImportedFileDataForNew) {
    super.onDataInitialized(data);

    this.isSelf = this.authHelper.isSelfOrOwner(data.user);

    this.form = this.formBuilder.group({
      description: null
    });
    this.fileControl = new FormControl(null, Validators.required);

    if (data.confirmationPasswordInput) {
      this.confirmationPasswordControl = new FormControl('', Validators.required);
    }

    const defaults = data.importedFile;
    switch (data.kind) {
      case ImportedFileKind.ADS:
        this.form.addControl('currency', new FormControl(defaults.currency, Validators.required));
        break;
      case ImportedFileKind.PAYMENTS:
        this.form.addControl('sendNotifications', new FormControl(!!defaults.sendNotifications));
        break;
      case ImportedFileKind.RECORDS:
        this.form.addControl('recordType', new FormControl(defaults.recordType, Validators.required));
        break;
      case ImportedFileKind.USERS:
        this.form.addControl('useGroupFromFile', new FormControl(defaults.useGroupFromFile));
        this.form.addControl('group', new FormControl(defaults.group, GROUP_VALIDATOR));
        this.form.addControl('sendActivationEmail', new FormControl(defaults.sendActivationEmail));
        break;
      case ImportedFileKind.USER_PAYMENTS:
        this.form.addControl('paymentType', new FormControl(defaults.paymentType, Validators.required));
        break;
      case ImportedFileKind.USER_SEND_VOUCHERS:
        this.useAmountFromFile$.next(!!defaults.useAmountFromFile);
        const useAmountFromFileControl = new FormControl(this.useAmountFromFile$.value);
        this.addSub(useAmountFromFileControl.valueChanges.subscribe(v => this.useAmountFromFile$.next(v)));
        this.form.addControl('voucherType', new FormControl(defaults.voucherType, Validators.required));
        this.form.addControl('useAmountFromFile', useAmountFromFileControl);
        this.form.addControl('amount', new FormControl(defaults.amount, AMOUNT_VALIDATOR));
        this.form.addControl('sendMessage', new FormControl(defaults.sendMessage));
        break;
    }

    if (data.kind === ImportedFileKind.USER_SEND_VOUCHERS) {
      const types = data.dataForSend?.types || [];
      if (types.length === 1) {
        this.onVoucherTypeSelected(types[0]);
      } else {
        this.step = 'voucher-type';
      }
    }
    if (!this.step) {
      this.step = 'form';
    }
  }

  get step() {
    return this.step$.value;
  }
  set step(step) {
    this.step$.next(step);
  }

  get voucherType() {
    return this.voucherType$.value;
  }
  set voucherType(voucherType) {
    this.voucherType$.next(voucherType);
  }

  submit(confirmationPassword?: string) {
    if (!validateBeforeSubmit(this.form) || !validateBeforeSubmit(this.fileControl)
      || (!confirmationPassword && this.confirmationPasswordControl && !validateBeforeSubmit(this.confirmationPasswordControl))) {
      return;
    }

    if (!confirmationPassword) {
      confirmationPassword = this.confirmationPasswordControl?.value;
    }

    const file = this.fileControl.value as File;
    const params = this.form.value as ImportedFileNew;

    let request: Observable<string>;
    if (this.generalKind) {
      request = this.importsService.importGeneralFile({
        kind: this.generalKind,
        confirmationPassword,
        body: { params, file }
      });
    } else {
      request = this.importsService.importUserFile({
        user: this.user,
        kind: this.userKind,
        confirmationPassword,
        body: { params, file }
      });
    }
    this.addSub(request.subscribe(id => this.router.navigate(['/imports', 'files', 'view', id])));
  }

  get createDeviceConfirmation(): () => CreateDeviceConfirmation {
    let type: DeviceConfirmationTypeEnum = null;
    let paymentType: string = null;
    let voucherType: string = null;
    switch (this.data.kind) {
      case ImportedFileKind.PAYMENTS:
        type = DeviceConfirmationTypeEnum.IMPORT_PAYMENTS;
        break;
      case ImportedFileKind.USER_PAYMENTS:
        type = DeviceConfirmationTypeEnum.IMPORT_USER_PAYMENTS;
        paymentType = this.form.controls.paymentType.value;
        break;
      case ImportedFileKind.USER_SEND_VOUCHERS:
        type = DeviceConfirmationTypeEnum.IMPORT_USER_SEND_VOUCHERS;
        voucherType = this.form.controls.voucherType.value;
        break;
    }
    return () => ({ type, paymentType, voucherType });
  }

  onVoucherTypeSelected(type: VoucherTypeDetailed) {
    this.form.patchValue({ voucherType: type.id });
    this.voucherType = type;
    this.step = 'form';
  }

  resolveMenu() {
    return this.importsHelper.resolveMenu(this.data);
  }
}
