import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  AccountWithCurrency, AvailabilityEnum, Currency, CustomFieldDetailed,
  DataForTransaction, PaymentPreview, PaymentSchedulingEnum, PerformPayment,
  TimeFieldEnum,
  TimeInterval,
  Transaction, TransactionAuthorizationStatusEnum, TransactionTypeData, TransferType,
} from 'app/api/models';
import { PaymentsService } from 'app/api/services/payments.service';
import { PosService } from 'app/api/services/pos.service';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { clearValidatorsAndErrors, empty, locateControl, scrollTop, validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep } from 'lodash-es';
import { isEqual } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { PaymentStepFormComponent } from 'app/ui/banking/payment/payment-step-form.component';

export type PaymentStep = 'form' | 'confirm' | 'done';

/** Validates that the first installment date is required when scheduled to a future date */
const FIRST_INSTALLMENT_DATE_VAL: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const scheduling = parent.get('scheduling').value;
    const firstInstallmentIsNow = parent.get('firstInstallmentIsNow').value;
    if (empty(control.value) && (scheduling === 'futureDate'
      || scheduling === PaymentSchedulingEnum.SCHEDULED && !firstInstallmentIsNow)) {
      return {
        required: true,
      };
    }
  }
  return null;
};

/** Validates that occurrences count is required and > 2 when payment is recurring and not until manually cancel */
const OCCURRENCES_COUNT_VAL: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const scheduling = parent.get('scheduling').value;
    const repeatUntilCanceled = parent.get('repeatUntilCanceled').value;
    if (scheduling === PaymentSchedulingEnum.RECURRING && !repeatUntilCanceled) {
      const value = parseInt(control.value, 10);
      if (isNaN(value)) {
        // The occurrences count is required
        return {
          required: true,
        };
      } else {
        // Needs at least 2 occurrences
        return Validators.min(2)(control);
      }
    }
  }
  return null;
};

/** Validates that the first occurrence date is required when rec to a future date */
const FIRST_OCCURRENCE_DATE_VAL: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const scheduling = parent.get('scheduling').value;
    const firstOccurrenceIsNow = parent.get('firstOccurrenceIsNow').value;
    if (empty(control.value) && scheduling === PaymentSchedulingEnum.RECURRING && !firstOccurrenceIsNow) {
      return {
        required: true,
      };
    }
  }
  return null;
};

/**
 * Perform a payment
 */
@Component({
  // tslint:disable-next-line: component-selector
  selector: 'payment',
  templateUrl: 'payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent extends BasePageComponent<DataForTransaction> implements OnInit {

  @ViewChild('paymentStepForm') paymentStepForm: PaymentStepFormComponent;

  ConfirmationMode = ConfirmationMode;

  fromParam: string;
  toParam: string;
  fromSelf: boolean;
  fromSystem: boolean;
  toSelf: boolean;
  toSystem: boolean;
  pos: boolean;

  steps: PaymentStep[] = ['form', 'confirm', 'done'];
  step$ = new BehaviorSubject<PaymentStep>(null);
  form: FormGroup;
  confirmationPassword: FormControl;
  currency$ = new BehaviorSubject<Currency>(null);
  title: string;
  mobileTitle: string;
  actualData: DataForTransaction;
  preview: PaymentPreview;
  canConfirm: boolean;
  performed: Transaction;
  paymentTypeData$ = new BehaviorSubject<TransactionTypeData>(null);
  availablePaymentTypes: TransferType[];
  lastPaymentTypeData: TransactionTypeData;
  lastValue: any;
  customValuesControls = new Map<string, FormControl>();
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);

  get step(): PaymentStep {
    return this.step$.value;
  }
  set step(step: PaymentStep) {
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

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService,
    private paymentsService: PaymentsService,
    private posService: PosService,
    private changeDetector: ChangeDetectorRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Resolve the from and to parameters
    const route = this.route.snapshot;
    this.pos = route.url[route.url.length - 1].path === 'pos';
    if (!this.pos) {
      this.fromParam = route.params.from;
      this.fromSelf = this.authHelper.isSelf(this.fromParam);
      this.fromSystem = this.authHelper.isSystem(this.fromParam);
      this.toParam = route.params.to;
      this.toSelf = this.toParam != null && this.authHelper.isSelf(this.toParam);
      this.toSystem = this.toParam != null && this.authHelper.isSystem(this.toParam);
    }

    // Resolve the correct title according to the from and to parameters
    if (this.pos) {
      this.title = this.i18n.transaction.title.pos;
      this.mobileTitle = this.i18n.transaction.mobileTitle.pos;
    } else if (this.fromSystem) {
      if (this.toSystem) {
        this.title = this.i18n.transaction.title.paymentSystemToSystem;
        this.mobileTitle = this.i18n.transaction.mobileTitle.paymentSystemToSystem;
      } else {
        this.title = this.i18n.transaction.title.paymentSystemToUser;
        this.mobileTitle = this.i18n.transaction.mobileTitle.paymentSystemToUser;
      }
    } else {
      if (this.toSelf) {
        this.title = this.i18n.transaction.title.paymentToSelf;
        this.mobileTitle = this.i18n.transaction.mobileTitle.paymentToSelf;
      } else if (this.toSystem) {
        this.title = this.i18n.transaction.title.paymentToSystem;
        this.mobileTitle = this.i18n.transaction.mobileTitle.paymentToSystem;
      } else {
        this.title = this.i18n.transaction.title.paymentToUser;
        this.mobileTitle = this.i18n.transaction.mobileTitle.paymentToUser;
      }
    }

    // Build the form
    this.form = this.buildForm();

    // The confirmation password is hold in a separated control
    this.confirmationPassword = this.formBuilder.control(null);

    // Get the payment / pos data
    if (this.pos) {
      this.addSub(this.posService.dataForReceivePayment({})
        .subscribe(data => this.data = data));
    } else {
      this.addSub(this.paymentsService.dataForPerformPayment({
        owner: this.fromParam,
        to: this.toParam,
      }).subscribe(data => this.data = data));
    }

    // When the account changes, update the currency
    this.addSub(this.form.get('account').valueChanges.subscribe(type => this.updateCurrency(this.data, type)));

    // When the payment type data changes, update the form validation and fields
    this.addSub(this.paymentTypeData$.subscribe(typeData => {
      if (this.lastPaymentTypeData == null || !isEqual(this.lastPaymentTypeData, typeData)) {
        this.adjustForm(typeData);
      }
      this.lastPaymentTypeData = typeData;
    }));

    // Adjust the conditional validators (for example, for scheduling)
    this.addSub(this.form.valueChanges.subscribe(value => this.adjustFormValidators(value)));
  }

  private buildForm(): FormGroup {
    // Custom values are handled separatedly
    return this.formBuilder.group({
      account: null,
      subject: [this.pos ? null : this.toParam, Validators.required],
      type: [null, Validators.required],
      amount: [null, Validators.required],
      description: null,
      scheduling: [PaymentSchedulingEnum.DIRECT, Validators.required],
      installmentsCount: null,
      firstInstallmentIsNow: true,
      firstInstallmentDate: [null, FIRST_INSTALLMENT_DATE_VAL],
      repeatUntilCanceled: true,
      occurrencesCount: [null, OCCURRENCES_COUNT_VAL],
      firstOccurrenceIsNow: true,
      firstOccurrenceDate: [null, FIRST_OCCURRENCE_DATE_VAL],
      occurrenceInterval: [{ amount: 1, field: TimeFieldEnum.MONTHS } as TimeInterval, Validators.required]
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

  adjustFormValidators(value: any) {
    if (this.lastValue && isEqual(this.lastValue, value)) {
      return;
    }
    this.lastValue = value;
    const firstInstallmentDate = this.form.get('firstInstallmentDate');
    if (value.scheduling === 'futureDate' || value.scheduling === PaymentSchedulingEnum.SCHEDULED && !value.firstInstallmentIsNow) {
      firstInstallmentDate.setValidators(Validators.required);
    } else {
      clearValidatorsAndErrors(firstInstallmentDate);
    }
    const installmentsCount = this.form.get('installmentsCount');
    if (value.scheduling === PaymentSchedulingEnum.SCHEDULED) {
      installmentsCount.setValidators(Validators.compose([Validators.required, Validators.min(2)]));
    } else {
      clearValidatorsAndErrors(installmentsCount);
    }
    const occurrencesCount = this.form.get('occurrencesCount');
    const firstOccurrenceDate = this.form.get('firstOccurrenceDate');
    if (value.scheduling === PaymentSchedulingEnum.RECURRING) {
      if (value.repeatUntilCanceled) {
        clearValidatorsAndErrors(occurrencesCount);
      } else {
        occurrencesCount.setValidators(Validators.compose([Validators.required, Validators.min(2)]));
      }
      if (value.firstOccurrenceIsNow) {
        clearValidatorsAndErrors(firstOccurrenceDate);
      } else {
        firstOccurrenceDate.setValidators(Validators.required);
      }
    } else {
      clearValidatorsAndErrors(occurrencesCount);
      clearValidatorsAndErrors(firstOccurrenceDate);
    }
    this.changeDetector.detectChanges();
  }

  onDataInitialized(data: DataForTransaction) {
    if (empty(data.accounts)) {
      // No accounts
      this.notification.error(this.i18n.transaction.noAccounts);
    } else {
      // Set the initial step
      this.step = 'form';
      // Set the from account type
      const type = data.accounts[0].type.id;
      this.form.patchValue({ account: type }, { emitEvent: false });
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
    this.paymentStepForm.removeSubscriptions();
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
      this.paymentStepForm.createSubscriptions();
      return;
    }
    this.addSub(this.confirmDataRequest().subscribe(preview => {
      this.preview = preview;
      this.step = 'confirm';
      this.canConfirm = this.authHelper.canConfirm(preview.confirmationPasswordInput);
      if (!this.canConfirm) {
        this.notification.warning(this.authHelper.getConfirmationMessage(preview.confirmationPasswordInput, this.pos));
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
    let request: Observable<Transaction>;
    if (this.pos) {
      request = this.posService.receivePayment({
        body: this.preview.payment,
        confirmationPassword: this.confirmationPassword.value,
      });
    } else {
      request = this.paymentsService.performPayment({
        owner: this.fromParam,
        body: this.preview.payment,
        confirmationPassword: this.confirmationPassword.value,
      });
    }
    request.pipe(first()).subscribe(performed => {
      this.performed = performed;
      this.step = 'done';
      scrollTop();
    });
  }

  private confirmDataRequest(): Observable<PaymentPreview> {
    // Clone value before manipulate it otherwise it will trigger
    // valueChanges and eventually will hide/display some fields
    const value = cloneDeep(this.form.value);
    const payment: PerformPayment = value;
    switch (value.scheduling) {
      case 'futureDate':
        // The futureDate value is not on the enum, just used internally. Send the proper value.
        payment.scheduling = PaymentSchedulingEnum.SCHEDULED;
        payment.installmentsCount = 1;
        break;
      case PaymentSchedulingEnum.SCHEDULED:
        if (value.firstInstallmentIsNow) {
          // First installment to now == null first date
          payment.firstInstallmentDate = null;
        }
        break;
      case PaymentSchedulingEnum.RECURRING:
        if (value.repeatUntilCanceled) {
          // Repeat until canceled == null occurrences count
          payment.occurrencesCount = null;
        }
        if (value.firstOccurrenceIsNow) {
          // First installment to now == null first date
          payment.firstOccurrenceDate = null;
        }
        break;
    }
    // These properties are not to be submitted, only for internal control
    delete value.firstInstallmentIsNow;
    delete value.repeatUntilCanceled;
    delete value.firstOccurrenceIsNow;
    // Preview
    if (this.pos) {
      return this.posService.previewReceivePayment({
        body: payment,
      });
    } else {
      return this.paymentsService.previewPayment({
        owner: this.fromParam,
        body: payment,
      });
    }
  }

  get doneTitle(): string {
    if (this.performed) {
      return this.performed.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING
        ? this.i18n.transaction.title.pendingPayment
        : this.i18n.transaction.title.processedPayment;
    }
  }

  get doneMobileTitle(): string {
    if (this.performed) {
      return this.performed.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING
        ? this.i18n.transaction.mobileTitle.pendingPayment
        : this.i18n.transaction.mobileTitle.processedPayment;
    }
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
    if (this.pos) {
      return Menu.POS;
    } else if (this.fromSystem) {
      // Payment from system
      return this.toSystem ? Menu.PAYMENT_TO_SYSTEM : Menu.PAYMENT_TO_USER;
    } else {
      // Payment from user
      const ownMenu = this.toSystem ? Menu.PAYMENT_TO_SYSTEM
        : this.toSelf ? Menu.PAYMENT_TO_SELF : Menu.PAYMENT_TO_USER;
      return this.menu.userMenu(data.fromUser, ownMenu);
    }
  }

}
