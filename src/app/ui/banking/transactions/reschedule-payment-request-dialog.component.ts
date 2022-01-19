import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AcceptOrReschedulePaymentRequest, CreateDeviceConfirmation, TransactionView } from 'app/api/models';
import { PaymentRequestsService } from 'app/api/services/payment-requests.service';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';
import { PaymentRequestScheduledTo } from 'app/ui/banking/request-payment/payment-request-scheduled-to';

/**
 * Presents the fields to reschedule a payment request
 */
@Component({
  selector: 'reschedule-payment-request-dialog',
  templateUrl: 'reschedule-payment-request-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReschedulePaymentRequestDialogComponent extends BaseComponent implements OnInit {
  ConfirmationMode = ConfirmationMode;
  PaymentRequestScheduledTo = PaymentRequestScheduledTo;

  @Input() createDeviceConfirmation: () => CreateDeviceConfirmation;
  @Input() transaction: TransactionView;
  @Output() done = new EventEmitter<void>();

  form: FormGroup;
  rescheduleTo: FormControl;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);
  canConfirm: boolean;

  constructor(
    injector: Injector,
    private paymentRequestsService: PaymentRequestsService,
    private authHelper: AuthHelperService,
    public modalRef: BsModalRef
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.rescheduleTo = new FormControl(PaymentRequestScheduledTo.EXPIRY);
    this.form = this.formBuilder.group({
      processDate: null,
      comments: null
    });
    this.addSub(this.rescheduleTo.valueChanges.subscribe(rescheduleTo => {
      if (rescheduleTo === PaymentRequestScheduledTo.DATE) {
        this.form.controls.processDate.setValidators(Validators.required);
      } else {
        this.form.controls.processDate.clearValidators();
      }
      const processDate: string = rescheduleTo === PaymentRequestScheduledTo.EXPIRY
        ? this.transaction.expirationDate : null;
      this.form.patchValue({ processDate });
    }));
    if (this.transaction.confirmationPasswordInput) {
      this.form.setControl('confirmationPassword', this.formBuilder.control(null, Validators.required));
    }
    this.canConfirm = this.authHelper.canConfirm(this.transaction.confirmationPasswordInput);
  }

  confirm(confirmationPassword?: string) {
    if (confirmationPassword) {
      this.form.patchValue({ confirmationPassword });
    }
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = this.form.value;
    const body: AcceptOrReschedulePaymentRequest = value;
    confirmationPassword = value.confirmationPassword;
    delete value.confirmationPassword;
    this.addSub(this.paymentRequestsService.reschedulePaymentRequest({
      key: this.transaction.id,
      body,
      confirmationPassword
    }).subscribe(() => {
      this.done.emit();
      this.hide();
    }));
  }

  hide() {
    this.modalRef.hide();
  }
}
