import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PaymentPreview, TransferFeePreview, CreateDeviceConfirmation, DeviceConfirmationTypeEnum, User, AccountKind } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { ApiHelper } from 'app/shared/api-helper';
import { Enter } from 'app/shared/shortcut.service';


/**
 * Payment step: confirm the payment
 */
@Component({
  selector: 'payment-step-confirm',
  templateUrl: 'payment-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStepConfirmComponent extends BaseComponent implements OnInit {

  fromUser: User;
  fromSelf: boolean;
  fromSystem: boolean;
  toUser: User;
  toSelf: boolean;
  toSystem: boolean;
  @Input() preview: PaymentPreview;
  @Input() confirmationPassword: FormControl;
  @Input() showPaymentType: boolean;
  @Output() confirmationModeChanged = new EventEmitter<ConfirmationMode>();
  @Output() confirmed = new EventEmitter<string>();

  fees: TransferFeePreview[];

  form: FormGroup;

  createDeviceConfirmation: () => CreateDeviceConfirmation;

  constructor(injector: Injector,
    public bankingHelper: BankingHelperService) {
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

    this.form = this.formBuilder.group({});
    this.form.setControl('confirmationPassword', this.confirmationPassword);
    this.fees = this.preview.fees;
    if (empty(this.fees) && (this.preview.installments || []).length === 1) {
      // Show the preview of the single installment instead
      this.fees = this.preview.installments[0].fees;
    }
    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.PERFORM_PAYMENT,
        from: ApiHelper.accountOwner(this.preview.fromAccount),
        to: ApiHelper.accountOwner(this.preview.toAccount),
        paymentType: this.preview.paymentType.id,
        amount: this.preview.payment.amount
      };
    };
    // When there's no confirmation password, the Enter key will confirm
    if (!this.preview.confirmationPasswordInput) {
      this.addShortcut(Enter, () => this.confirmed.emit());
    }
  }

}
