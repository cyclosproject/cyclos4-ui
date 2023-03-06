import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AccountKind, CreateDeviceConfirmation, DeviceConfirmationTypeEnum,
  PaymentRequestActionEnum, PaymentRequestPreview, PerformPayment, TransferFeePreview, User
} from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { Enter } from 'app/core/shortcut.service';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { PaymentRequestScheduledTo } from 'app/ui/banking/request-payment/payment-request-scheduled-to';

/**
 * Payment step: confirm the accepted payment request
 */
@Component({
  selector: 'accept-payment-request-confirm',
  templateUrl: 'accept-payment-request-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptPaymentRequestConfirmComponent extends BaseComponent implements OnInit {
  PaymentRequestScheduledTo = PaymentRequestScheduledTo;

  fromUser: User;
  fromSelf: boolean;
  fromSystem: boolean;
  toUser: User;
  toSelf: boolean;
  toSystem: boolean;
  @Input() form: FormGroup;
  @Input() preview: PaymentRequestPreview;
  @Input() transaction: string;
  @Input() confirmationPassword: FormControl;
  @Input() showPaymentType: boolean;
  @Output() showSubmit = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<string>();

  scheduleTo: FormControl;
  fees: TransferFeePreview[];

  createDeviceConfirmation: () => CreateDeviceConfirmation | PerformPayment;

  constructor(
    injector: Injector,
    private authHelper: AuthHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.fromUser = this.preview.fromAccount.user;
    this.fromSelf = this.fromUser && this.authHelper.isSelf(this.fromUser);
    this.fromSystem = this.preview.fromAccount.kind === AccountKind.SYSTEM;

    this.toUser = this.preview.toAccount.user;
    this.toSelf = this.toUser && this.authHelper.isSelf(this.toUser);
    this.toSystem = this.preview.toAccount.kind === AccountKind.SYSTEM;

    this.scheduleTo = new FormControl(PaymentRequestScheduledTo.NOW);
    this.addSub(this.scheduleTo.valueChanges.subscribe(rescheduleTo => {
      if (rescheduleTo === PaymentRequestScheduledTo.DATE) {
        this.form.controls.processDate.setValidators(Validators.required);
      } else {
        this.form.controls.processDate.clearValidators();
      }
      const processDate: string = rescheduleTo === PaymentRequestScheduledTo.EXPIRY
        ? this.preview.paymentRequest.expirationDate : null;
      this.form.patchValue({ processDate });
    }));

    this.form.setControl('confirmationPassword', this.confirmationPassword);
    this.fees = this.preview.fees;
    if (empty(this.fees) && (this.preview.installments || []).length === 1) {
      // Show the preview of the single installment instead
      this.fees = this.preview.installments[0].fees;
    }
    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.MANAGE_PAYMENT_REQUEST,
        transaction: this.transaction,
        paymentRequestAction: PaymentRequestActionEnum.ACCEPT
      };
    };
    // When there's no confirmation password, the Enter key will confirm
    if (!this.preview.confirmationPasswordInput) {
      this.addShortcut(Enter, () => this.confirmed.emit());
    }
  }

}
