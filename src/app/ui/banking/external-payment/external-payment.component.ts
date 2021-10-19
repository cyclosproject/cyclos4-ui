import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AccountWithCurrency, AvailabilityEnum, Currency, CustomFieldDetailed,
  DataForTransaction, ExternalPaymentPreview, Transaction, TransactionTypeData, TransferType
} from 'app/api/models';
import { ExternalPaymentsService } from 'app/api/services/external-payments.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { clearValidatorsAndErrors, empty, locateControl, scrollTop, validateBeforeSubmit } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { isEqual } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

export type ExternalPaymentStep = 'error' | 'form' | 'confirm' | 'done';

/**
 * Perform an external payment
 */
@Component({
  selector: 'external-payment',
  templateUrl: 'external-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalPaymentComponent extends BasePageComponent<DataForTransaction> implements OnInit {

  ConfirmationMode = ConfirmationMode;

  ownerParam: string;
  fromSelf: boolean;
  fromSystem: boolean;

  // for the error step there will be an error message stored in the generalError$ variable
  steps: ExternalPaymentStep[] = ['error', 'form', 'confirm', 'done'];
  step$ = new BehaviorSubject<ExternalPaymentStep>(null);
  form: FormGroup;
  currency$ = new BehaviorSubject<Currency>(null);
  title: string;
  mobileTitle: string;
  actualData: DataForTransaction;
  confirmationPassword: FormControl;
  canConfirm: boolean;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);
  preview: ExternalPaymentPreview;
  performed: Transaction;
  paymentTypeData$ = new BehaviorSubject<TransactionTypeData>(null);
  availablePaymentTypes: TransferType[];
  lastPaymentTypeData: TransactionTypeData;
  lastValue: any;
  customValuesControls = new Map<string, FormControl>();
  _generalError: string;

  get step(): ExternalPaymentStep {
    return this.step$.value;
  }
  set step(step: ExternalPaymentStep) {
    this.step$.next(step);
  }

  get currency(): Currency {
    return this.currency$.value;
  }
  set currency(currency: Currency) {
    this.currency$.next(currency);
  }

  get paymentTypeData(): TransactionTypeData {
    return this.paymentTypeData$.value;
  }
  set paymentTypeData(data: TransactionTypeData) {
    this.paymentTypeData$.next(data);
    this.updatePaymentTypeData(data);
  }

  get generalError(): string {
    return this._generalError;
  }

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService,
    private externalPaymentsService: ExternalPaymentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Resolve the from and to parameters
    const route = this.route.snapshot;
    this.ownerParam = route.params.owner;
    this.fromSelf = this.authHelper.isSelf(this.ownerParam);
    this.fromSystem = this.authHelper.isSystem(this.ownerParam);

    // Resolve the correct title according to the from and to parameters
    if (this.fromSystem) {
      this.title = this.i18n.transaction.title.externalPaymentFromSystem;
      this.mobileTitle = this.i18n.transaction.mobileTitle.externalPaymentFromSystem;
    } else {
      this.title = this.i18n.transaction.title.externalPaymentFromUser;
      this.mobileTitle = this.i18n.transaction.mobileTitle.externalPaymentFromUser;
    }

    // Build the form
    this.form = this.buildForm();

    // The confirmation password is hold in a separated control
    this.confirmationPassword = this.formBuilder.control(null);

    // Get the payment data
    this.addSub(this.externalPaymentsService.dataForPerformExternalPayment({
      owner: this.ownerParam
    }).subscribe(data => this.data = data));

    // When the account changes, update the currency
    this.addSub(this.form.get('account').valueChanges.subscribe(type => this.updateCurrency(this.data, type)));

    // When the payment type data changes, update the form validation and fields
    this.addSub(this.paymentTypeData$.subscribe(typeData => {
      if (this.lastPaymentTypeData == null || !isEqual(this.lastPaymentTypeData, typeData)) {
        this.adjustForm(typeData);
      }
      this.lastPaymentTypeData = typeData;
    }));
  }

  private buildForm(): FormGroup {
    // Custom values are handled separatedly
    return this.formBuilder.group({
      account: null,
      subject: [this.ownerParam, Validators.required],
      type: [null, Validators.required],
      amount: [null, Validators.required],
      toPrincipalType: [null, Validators.required],
      toPrincipalValue: [null, Validators.required],
      description: null
    });
  }

  private updateCurrency(data: DataForTransaction, type: string) {
    let account: AccountWithCurrency = null;
    if (!empty(type) && data && data.accounts) {
      account = data.accounts.find(a => a.type.id === type);
    }
    this.currency = account ? account.currency : null;
  }

  private adjustForm(typeData: TransactionTypeData) {
    const description = this.form.get('description');
    if ((typeData || {}).descriptionAvailability === AvailabilityEnum.REQUIRED) {
      description.setValidators(Validators.required);
    } else {
      clearValidatorsAndErrors(description);
    }
    // Custom fields are handled separatedly
  }

  onDataInitialized(data: DataForTransaction) {
    if (empty(data.accounts)) {
      this.step = 'error';
      this._generalError = this.i18n.transaction.noAccounts;
    } else if (empty(data.principalTypes)) {
      this.step = 'error';
      this._generalError = this.i18n.transaction.noExternalPaymentPrincipalTypes;
    } else {
      // Set the initial step
      this.step = 'form';
      // Set the from account type
      const type = data.accounts[0].type.id;
      this.form.patchValue({
        account: type,
        toPrincipalType: data.principalTypes[0]?.id
      }, { emitEvent: false });
      // Update the current currency
      this.updateCurrency(data, type);
    }
  }

  updatePaymentTypeData(data: TransactionTypeData) {
    // Handle the fixed amount
    const amount = this.form.get('amount');
    if (data && data.fixedAmount) {
      amount.setValue(data.fixedAmount);
      amount.disable();
    } else if (amount.disabled) {
      amount.enable();
    }
  }

  backToForm() {
    this.step = 'form';
  }

  toConfirm() {
    // Before proceeding, copy the value of all valid custom fields
    const customValueControls: { [key: string]: AbstractControl; } = {};
    const typeData = this.paymentTypeData;
    if (typeData && typeData.customFields) {
      for (const cf of typeData.customFields) {
        customValueControls[cf.internalName] = this.customValuesControlGetter(cf);
      }
    }
    this.form.setControl('customValues', new FormGroup(customValueControls));
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    this.addSub(this.externalPaymentsService.previewExternalPayment({
      owner: this.ownerParam,
      body: this.form.value
    }).subscribe(preview => {
      this.preview = preview;
      this.step = 'confirm';
      this.canConfirm = this.authHelper.canConfirm(preview.confirmationPasswordInput);
      if (!this.canConfirm) {
        this.notification.warning(this.authHelper.getConfirmationMessage(preview.confirmationPasswordInput));
      }
      const val = preview.confirmationPasswordInput ? Validators.required : null;
      this.confirmationPassword.setValidators(val);
      scrollTop();
    }));
  }

  perform(password?: string) {
    if (password) {
      this.confirmationPassword.setValue(password);
    }
    if (!validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }
    // Before proceeding, copy the value of all valid custom fields
    const customValueControls: { [key: string]: AbstractControl; } = {};
    const typeData = this.paymentTypeData;
    if (typeData && typeData.customFields) {
      for (const cf of typeData.customFields) {
        customValueControls[cf.internalName] = this.customValuesControlGetter(cf);
      }
    }
    this.form.setControl('customValues', new FormGroup(customValueControls));
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    this.externalPaymentsService.performExternalPayment({
      owner: this.ownerParam,
      body: this.form.value,
      confirmationPassword: this.confirmationPassword.value
    }).pipe(first()).subscribe(performed => {
      this.performed = performed;
      this.step = 'done';
      scrollTop();
    });
  }

  viewPerformed() {
    this.router.navigate(['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(this.performed)]);
  }

  reload() {
    this.step = null;
    this.currency = null;
    this.paymentTypeData = null;
    super.reload();
  }

  locateControl(locator: FormControlLocator) {
    return locateControl(this.form, locator);
  }

  get customValuesControlGetter() {
    return (cf: CustomFieldDetailed) => {
      const name = cf.internalName;
      let control = this.customValuesControls.get(name);
      if (control == null) {
        control = this.formBuilder.control(cf.defaultValue, cf.required ? Validators.required : null);
        this.customValuesControls.set(name, control);
      }
      return control;
    };
  }

  resolveMenu(data: DataForTransaction) {
    if (this.fromSystem) {
      // Payment from system
      return Menu.EXTERNAL_PAYMENTS;
    } else {
      // Payment from user
      return this.menu.userMenu(data.fromUser, Menu.EXTERNAL_PAYMENTS);
    }
  }

}
