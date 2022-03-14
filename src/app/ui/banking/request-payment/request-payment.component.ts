import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  AccountWithCurrency, AvailabilityEnum, Currency, CustomFieldDetailed, DataForTransaction, PaymentRequestSchedulingEnum,
  PaymentSchedulingEnum, SendPaymentRequest, TransactionTypeData, TransferType
} from 'app/api/models';
import { PaymentRequestsService } from 'app/api/services/payment-requests.service';
import { ApiHelper } from 'app/shared/api-helper';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { clearValidatorsAndErrors, empty, locateControl, validateBeforeSubmit } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep, isEqual } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';

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

/**
 * Send a payment request
 */
@Component({
  selector: 'request-payment',
  templateUrl: 'request-payment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPaymentComponent extends BasePageComponent<DataForTransaction> implements OnInit {

  fromParam: string;
  toParam: string;
  fromSelf: boolean;
  fromSystem: boolean;
  toSelf: boolean;
  toSystem: boolean;

  form: FormGroup;
  currency$ = new BehaviorSubject<Currency>(null);
  title: string;
  mobileTitle: string;
  actualData: DataForTransaction;
  preview: SendPaymentRequest;
  canConfirm: boolean;
  paymentTypeData$ = new BehaviorSubject<TransactionTypeData>(null);
  availablePaymentTypes: TransferType[];
  lastPaymentTypeData: TransactionTypeData;
  lastValue: any;
  customValuesControls = new Map<string, FormControl>();

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
    private paymentRequestsService: PaymentRequestsService,
    private changeDetector: ChangeDetectorRef) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Resolve the from and to parameters
    const route = this.route.snapshot;
    this.fromParam = route.params.from;
    this.fromSelf = this.authHelper.isSelf(this.fromParam);
    this.fromSystem = this.authHelper.isSystem(this.fromParam);
    this.toParam = route.params.to;
    this.toSelf = this.toParam != null && this.authHelper.isSelf(this.toParam);
    this.toSystem = this.toParam != null && this.authHelper.isSystem(this.toParam);

    // Resolve the correct title according to the from and to parameters
    if (this.fromSystem) {
      this.title = this.i18n.transaction.title.paymentRequestSystemToUser;
      this.mobileTitle = this.i18n.transaction.mobileTitle.paymentRequestSystemToUser;
    } else {
      if (this.toSystem) {
        this.title = this.i18n.transaction.title.paymentRequestToSystem;
        this.mobileTitle = this.i18n.transaction.mobileTitle.paymentRequestToSystem;
      } else {
        this.title = this.i18n.transaction.title.paymentRequestToUser;
        this.mobileTitle = this.i18n.transaction.mobileTitle.paymentRequestToUser;
      }
    }

    // Build the form
    this.form = this.buildForm();

    // Get the payment data
    this.addSub(this.paymentRequestsService.dataForSendPaymentRequest({
      owner: this.fromParam,
      to: this.toParam,
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

    // Adjust the conditional validators (for example, for scheduling)
    this.addSub(this.form.valueChanges.subscribe(value => this.adjustFormValidators(value)));
  }

  private buildForm(): FormGroup {
    // Custom values are handled separatedly
    return this.formBuilder.group({
      account: null,
      subject: [this.toParam, Validators.required],
      type: [null, Validators.required],
      amount: [null, Validators.required],
      expirationDate: [null, Validators.required],
      description: null,
      scheduling: [PaymentSchedulingEnum.DIRECT, Validators.required],
      installmentsCount: null,
      firstInstallmentIsImmediate: false,
      repeatUntilCanceled: true,
      occurrencesCount: [null, OCCURRENCES_COUNT_VAL],
      firstOccurrenceIsImmediate: false,
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
    if ((typeData || {}).defaultExpirationDate) {
      this.form.get('expirationDate').setValue(typeData.defaultExpirationDate);
    }
    // Custom fields are handled separatedly
  }

  adjustFormValidators(value: any) {
    if (this.lastValue && isEqual(this.lastValue, value)) {
      return;
    }
    this.lastValue = value;
    const installmentsCount = this.form.get('installmentsCount');
    if (value.scheduling === PaymentSchedulingEnum.SCHEDULED) {
      installmentsCount.setValidators(Validators.compose([Validators.required, Validators.min(2)]));
    } else {
      clearValidatorsAndErrors(installmentsCount);
    }
    const occurrencesCount = this.form.get('occurrencesCount');
    if (value.scheduling === PaymentSchedulingEnum.RECURRING) {
      if (value.repeatUntilCanceled) {
        clearValidatorsAndErrors(occurrencesCount);
      } else {
        occurrencesCount.setValidators(Validators.compose([Validators.required, Validators.min(2)]));
      }
    } else {
      clearValidatorsAndErrors(occurrencesCount);
    }
    this.changeDetector.detectChanges();
  }

  onDataInitialized(data: DataForTransaction) {
    if (empty(data.accounts)) {
      // No accounts
      this.notification.error(this.bankingHelper.noAccountForPaymentErrorMessage());
    } else {
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

  perform() {
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
    this.confirmation.confirm({
      title: this.i18n.general.confirm,
      message: this.i18n.transaction.confirmPaymentRequest,
      callback: () =>
        this.paymentRequestsService.sendPaymentRequest({
          owner: this.fromParam,
          body: this.confirmDataRequest(),
        }).pipe(first()).subscribe(performed => {
          this.router.navigate(['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(performed)],
            { state: { url: this.router.url } });
        })
    });

  }

  private confirmDataRequest(): SendPaymentRequest {
    // Clone value before manipulate it otherwise it will trigger
    // valueChanges and eventually will hide/display some fields
    const value = cloneDeep(this.form.value);
    const payment: SendPaymentRequest = value;
    switch (value.scheduling) {
      case 'futureDate':
        // The futureDate value is not on the enum, just used internally. Send the proper value.
        payment.scheduling = PaymentRequestSchedulingEnum.SCHEDULED;
        payment.installmentsCount = 1;
        break;
      case PaymentRequestSchedulingEnum.RECURRING:
        if (value.repeatUntilCanceled) {
          // Repeat until canceled == null occurrences count
          payment.occurrencesCount = null;
        }
        break;
    }
    payment.expirationDate = ApiHelper.shiftToDayEnd(payment.expirationDate);
    // These properties are not to be submitted, only for internal control
    delete value.firstInstallmentIsNow;
    delete value.repeatUntilCanceled;
    delete value.firstOccurrenceIsNow;
    // Preview
    return payment;
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
      return Menu.PAYMENT_REQUESTS;
    } else {
      // Payment from user
      return this.menu.userMenu(data.fromUser, Menu.PAYMENT_REQUESTS);
    }
  }

}
