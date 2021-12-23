import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentRequestPreview } from 'app/api/models';
import { PaymentRequestsService } from 'app/api/services/payment-requests.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { empty, locateControl, validateBeforeSubmit } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';

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

  form: FormGroup;
  confirmationPassword: FormControl;
  canConfirm: boolean;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);

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
      const transactionId = this.form.value.processDate ? this.transactionKey : this.bankingHelper.transactionNumberOrId(performed);
      this.router.navigate(['/banking', 'transaction', transactionId], { replaceUrl: true, state: { showDoneMessage: true } });
    }));
  }

  locateControl(locator: FormControlLocator) {
    return locateControl(this.form, locator);
  }

  resolveMenu() {
    return Menu.PAYMENT_REQUESTS;
  }
}
