import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  CustomFieldDetailed,
  SendMediumEnum,
  VoucherBasicDataForTransaction,
  VoucherDataForRedeem,
  VoucherDataForTopUp,
  VoucherTransactionKind
} from 'app/api/models';
import { VoucherPinOnActivationEnum } from 'app/api/models/voucher-pin-on-activation-enum';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { FieldOption } from 'app/shared/field-option';

/**
 * Component used for inputting fields for a voucher transaction
 */
@Component({
  selector: 'voucher-transaction-step-form',
  templateUrl: './voucher-transaction-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherTransactionStepFormComponent extends BaseComponent implements OnInit {
  VoucherPinOnActivationEnum = VoucherPinOnActivationEnum;

  @Input() data: VoucherBasicDataForTransaction;
  @Input() form: FormGroup;
  @Input() amountAsField: boolean;
  @Input() pinIsSent: boolean;

  topUpData: VoucherDataForTopUp;

  sendMedium = new FormControl();
  manualPin = new FormControl(true);
  sendByOptions: FieldOption[];

  self: boolean;

  constructor(injector: Injector, private authHelper: AuthHelperService) {
    super(injector);
  }

  resolveCustomFields(): CustomFieldDetailed[] {
    const fields = (this.data as any).voucherCustomFields;
    return fields ? fields : [];
  }

  ngOnInit() {
    super.ngOnInit();
    this.self = this.authHelper.isSelf(this.data.user);
    if (this.data.kind == VoucherTransactionKind.TOP_UP) {
      this.topUpData = this.data as VoucherDataForTopUp;
      if (this.topUpData.isActivation) {
        this.sendMedium.setValue(this.pinIsSent ? SendMediumEnum.EMAIL : 'off');
        this.addSub(
          this.sendMedium.valueChanges.subscribe(v => {
            this.manualPin.setValue(v === 'off');
          })
        );
        this.sendByOptions = [];
        if (!this.pinIsSent) {
          this.sendByOptions.push({ value: 'off', text: this.i18n.voucher.topUp.dontSendNotifications });
        }
        this.sendByOptions.push({ value: SendMediumEnum.EMAIL, text: this.i18n.general.sendMedium.email });
        if (this.topUpData.phoneConfiguration) {
          this.sendByOptions.push({ value: SendMediumEnum.SMS, text: this.i18n.general.sendMedium.sms });
        }
        this.addSub(
          this.manualPin.valueChanges.subscribe(v => {
            if (v) {
              this.form.patchValue({ pin: '', pinConfirmation: '' });
            }
          })
        );
      }
    }
  }

  get balance() {
    return (this.data as VoucherDataForRedeem).balance;
  }

  get fixedAmount() {
    return this.data.kind == VoucherTransactionKind.TOP_UP
      ? this.topUpData.amount
      : (this.data as VoucherDataForRedeem).balance;
  }
}
