import { ChangeDetectionStrategy, Component, Injector, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import {
  AccountWithCurrency, TransactionAuthorizationStatusEnum, Currency, DataForTransaction,
  PaymentPreview, PaymentSchedulingEnum, PerformPayment, Transaction,
  TransactionTypeData, TransferType, AvailabilityEnum
} from 'app/api/models';
import { PaymentsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty, scrollTop, clearValidatorsAndErrors, locateControl } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormControlLocator } from 'app/shared/form-control-locator';

export type PaymentStep = 'form' | 'confirm' | 'done';

/** Validates that installments count is required and > 2 when payment is scheduled */
const INSTALLMENTS_COUNT_VAL: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const scheduling = parent.get('scheduling').value;
    if (scheduling === PaymentSchedulingEnum.SCHEDULED) {
      const number = parseInt(control.value, 10);
      if (isNaN(number)) {
        // The installments count is required
        return {
          required: true
        };
      } else {
        // Needs at least 2 installments
        return Validators.min(2)(control);
      }
    }
  }
  return null;
};

/** Validates that the first installment date is required when scheduled to a future date */
const FIRST_INSTALLMENT_DATE_VAL: ValidatorFn = control => {
  const parent = control.parent;
  if (parent) {
    const scheduling = parent.get('scheduling').value;
    const firstInstallmentIsNow = parent.get('firstInstallmentIsNow').value;
    if (empty(control.value) && (scheduling === 'futureDate'
      || scheduling === PaymentSchedulingEnum.SCHEDULED && !firstInstallmentIsNow)) {
      return {
        required: true
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
      const number = parseInt(control.value, 10);
      if (isNaN(number)) {
        // The occurrences count is required
        return {
          required: true
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
        required: true
      };
    }
  }
  return null;
};

/**
 * Perform a payment
 */
@Component({
  selector: 'perform-payment',
  templateUrl: 'perform-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformPaymentComponent extends BasePageComponent<DataForTransaction> implements OnInit {

  steps: PaymentStep[] = ['form', 'confirm', 'done'];
  step$ = new BehaviorSubject<PaymentStep>(null);
  form: FormGroup;
  confirmationPassword: FormControl;
  currency$ = new BehaviorSubject<Currency>(null);
  toParam: string;
  title: string;
  actualData: DataForTransaction;
  preview: PaymentPreview;
  performed: Transaction;
  paymentTypeData$ = new BehaviorSubject<TransactionTypeData>(null);
  availablePaymentTypes: TransferType[];
  lastValue: any;

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
    private paymentsService: PaymentsService,
    private changeDetector: ChangeDetectorRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Resolve the to parameter
    const route = this.route.snapshot;
    const menu = route.data.menu as Menu;
    switch (menu) {
      case Menu.PAYMENT_TO_SYSTEM:
        // Payment to system account
        this.toParam = ApiHelper.SYSTEM;
        this.title = this.i18n('Payment to system');
        break;
      case Menu.PAYMENT_TO_SELF:
        // Payment between own accounts
        this.toParam = ApiHelper.SELF;
        this.title = this.i18n('Payment between own accounts');
        break;
      default:
        // To user. Maybe null.
        this.toParam = route.params['to'];
        this.title = this.i18n('Payment to user');
        break;
    }

    // Build the form
    this.form = this.formBuilder.group({
      account: null,
      subject: [this.toParam, Validators.required],
      type: [null, Validators.required],
      amount: [null, Validators.required],
      customValues: this.formBuilder.group({}), // Custom values are dynamic
      scheduling: [PaymentSchedulingEnum.DIRECT, Validators.required],
      installmentsCount: null,
      firstInstallmentIsNow: true,
      firstInstallmentDate: null,
      repeatUntilCanceled: true,
      occurrencesCount: null,
      firstOccurrenceIsNow: true,
      firstOccurrenceDate: null
    });
    // The confirmation password is hold in a separated control
    this.confirmationPassword = this.formBuilder.control(null);

    // Get data for perform payment
    this.addSub(this.paymentsService.dataForPerformPayment({
      owner: ApiHelper.SELF,
      to: this.toParam
    }).subscribe(data => this.data = data));

    // When the account changes, update the currency
    this.addSub(this.form.get('account').valueChanges.subscribe(type => this.updateCurrency(this.data, type)));

    // When the payment type data changes, update the form validation and fields
    this.addSub(this.paymentTypeData$.subscribe(typeData => this.adjustForm(typeData)));

    // Adjust the conditional validators (for example, for scheduling)
    this.addSub(this.form.valueChanges.subscribe(value => this.adjustFormValidators(value)));
  }

  private updateCurrency(data: DataForTransaction, type: string) {
    let account: AccountWithCurrency = null;
    if (!empty(type) && data && data.accounts) {
      account = data.accounts.find(a => a.type.id === type);
    }
    this.currency = account ? account.currency : null;
  }

  private adjustForm(typeData: TransactionTypeData) {
    const description = (typeData || {}).descriptionAvailability;
    if (description == null || description === AvailabilityEnum.DISABLED) {
      this.form.removeControl('description');
    } else {
      const descriptionValidator = description === AvailabilityEnum.REQUIRED ? Validators.required : null;
      this.form.setControl('description', this.formBuilder.control(this.form.value.description, descriptionValidator));
    }
    this.form.setControl('customValues', ApiHelper.customValuesFormGroup(this.formBuilder, typeData ? typeData.customFields : []));
  }

  adjustFormValidators(value: any) {
    if (this.lastValue && isEqual(this.lastValue, value)) {
      return;
    }
    this.lastValue = cloneDeep(value);
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
      this.notification.error(this.i18n('You don\'t have any accounts to perform the payment'));
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
    if (!this.form.valid) {
      return;
    }
    this.addSub(this.confirmDataRequest().subscribe(preview => {
      this.preview = preview;
      this.step = 'confirm';
      const val = preview.confirmationPasswordInput ? Validators.required : null;
      this.confirmationPassword.setValidators(val);
      scrollTop();
    }));
  }

  perform() {
    this.addSub(this.performPaymentRequest().subscribe(performed => {
      this.performed = performed;
      this.step = 'done';
      scrollTop();
    }));
  }

  private confirmDataRequest(): Observable<PaymentPreview> {
    const value = this.form.value;
    const payment: PerformPayment = cloneDeep(value);
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
    delete payment['firstInstallmentIsNow'];
    delete payment['repeatUntilCanceled'];
    delete payment['firstOccurrenceIsNow'];
    // Preview
    return this.paymentsService.previewPayment({
      owner: ApiHelper.SELF,
      payment: payment
    });
  }

  private performPaymentRequest(): Observable<Transaction> {
    return this.paymentsService.performPayment({
      owner: ApiHelper.SELF,
      payment: this.preview.payment,
      confirmationPassword: this.confirmationPassword.value
    });
  }

  get doneTitle(): string {
    if (this.performed) {
      return this.performed.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING
        ? this.i18n('Payment submitted for authorization')
        : this.i18n('Payment performed');
    }
  }

  viewPerformed() {
    this.router.navigate(['banking', 'transaction', ApiHelper.transactionNumberOrId(this.performed)]);
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
}
