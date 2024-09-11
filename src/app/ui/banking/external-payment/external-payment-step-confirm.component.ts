import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AccountKind,
  CreateDeviceConfirmation,
  DeviceConfirmationTypeEnum,
  ExternalPaymentPreview,
  PerformPayment,
  TransferFeePreview,
  User
} from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { Enter } from 'app/core/shortcut.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';

/**
 * Payment step: confirm the payment
 */
@Component({
  selector: 'external-payment-step-confirm',
  templateUrl: 'external-payment-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalPaymentStepConfirmComponent extends BaseComponent implements OnInit {
  fromUser: User;
  fromSelf: boolean;
  fromSystem: boolean;
  @Input() preview: ExternalPaymentPreview;
  @Input() confirmationPassword: FormControl;
  @Input() showPaymentType: boolean;
  @Output() showSubmit = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<string>();

  fees: TransferFeePreview[];

  form: FormGroup;

  createDeviceConfirmation: () => CreateDeviceConfirmation | PerformPayment;

  constructor(injector: Injector, public bankingHelper: BankingHelperService, private authHelper: AuthHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.fromUser = this.preview.fromAccount.user;
    this.fromSelf = this.fromUser && this.authHelper.isSelf(this.fromUser);
    this.fromSystem = this.preview.fromAccount.kind === AccountKind.SYSTEM;

    this.form = this.formBuilder.group({});
    this.form.setControl('confirmationPassword', this.confirmationPassword);
    this.fees = this.preview.fees;
    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.PERFORM_EXTERNAL_PAYMENT,
        from: ApiHelper.accountOwner(this.preview.fromAccount),
        paymentType: this.preview.paymentType.id,
        amount: this.preview.payment.amount,
        toPrincipal: this.preview.payment.toPrincipalValue
      };
    };
    // When there's no confirmation password, the Enter key will confirm
    if (!this.preview.confirmationPasswordInput) {
      this.addShortcut(Enter, () => this.confirmed.emit());
    }
  }
}
