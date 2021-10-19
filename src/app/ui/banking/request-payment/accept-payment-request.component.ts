import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentRequestPreview, Transaction, TransactionAuthorizationStatusEnum } from 'app/api/models';
import { PaymentRequestsService } from 'app/api/services/payment-requests.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { empty, locateControl, scrollTop, validateBeforeSubmit } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';

export type PaymentStep = 'confirm' | 'done';

/**
 * Accepts a payment request
 */
@Component({
  selector: 'accept-payment-request',
  templateUrl: 'accept-payment-request.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptPaymentRequestComponent extends BasePageComponent<PaymentRequestPreview> implements OnInit {

  empty = empty;

  ConfirmationMode = ConfirmationMode;

  transactionKey: string;

  steps: PaymentStep[] = ['confirm', 'done'];
  step$ = new BehaviorSubject<PaymentStep>(null);
  form: FormGroup;
  confirmationPassword: FormControl;
  canConfirm: boolean;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);
  performed: Transaction;

  get step(): PaymentStep {
    return this.step$.value;
  }
  set step(step: PaymentStep) {
    this.step$.next(step);
  }

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService,
    private paymentRequestsService: PaymentRequestsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    // Resolve the from and to parameters
    this.transactionKey = this.route.snapshot.params.key;
    this.addSub(this.paymentRequestsService.previewPaymentRequest({ key: this.transactionKey }).subscribe(preview => this.data = preview));
  }

  onDataInitialized(data: PaymentRequestPreview) {
    // Build the form
    this.form = this.formBuilder.group({
      processDate: null,
      comments: null
    });

    // The confirmation password is hold in a separated control
    this.confirmationPassword = this.formBuilder.control(null);

    this.step = 'confirm';
    this.canConfirm = this.authHelper.canConfirm(data.confirmationPasswordInput);
    if (!this.canConfirm) {
      this.notification.warning(this.authHelper.getConfirmationMessage(data.confirmationPasswordInput));
    }
    const val = data.confirmationPasswordInput ? Validators.required : null;
    this.confirmationPassword.setValidators(val);
  }

  perform(password?: string) {
    if (!validateBeforeSubmit(this.form) || !validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }
    if (password) {
      this.confirmationPassword.setValue(password);
    }
    const value = cloneDeep(this.form.value);
    this.addSub(this.paymentRequestsService.acceptPaymentRequest({
      key: this.transactionKey,
      confirmationPassword: this.confirmationPassword.value,
      body: value
    }).subscribe(performed => {
      this.performed = performed;
      this.step = 'done';
      scrollTop();
    }));
  }

  get doneTitle(): string {
    if (this.form.value.processDate) {
      return this.i18n.transaction.title.paymentConfirmation;
    } else {
      return this.performed.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING
        ? this.i18n.transaction.title.pendingPayment
        : this.i18n.transaction.title.processedPayment;
    }
  }

  get doneMobileTitle(): string {
    if (this.form.value.processDate) {
      return this.i18n.transaction.mobileTitle.paymentConfirmation;
    } else {
      return this.performed.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING
        ? this.i18n.transaction.mobileTitle.pendingPayment
        : this.i18n.transaction.mobileTitle.processedPayment;
    }
  }

  viewPerformed() {
    this.router.navigate(['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(this.performed)]);
  }

  locateControl(locator: FormControlLocator) {
    return locateControl(this.form, locator);
  }

  resolveMenu() {
    return Menu.PAYMENT_REQUESTS;
  }
}
