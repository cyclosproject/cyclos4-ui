import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  BuyVoucher, CreateDeviceConfirmation, DeviceConfirmationTypeEnum, PasswordInput, VoucherDataForBuy,
  CustomFieldTypeEnum, CustomField
} from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { Enter } from 'app/shared/shortcut.service';

@Component({
  selector: 'buy-vouchers-step-confirm',
  templateUrl: 'buy-vouchers-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyVouchersStepConfirmComponent extends BaseComponent implements OnInit {

  @Input() confirmationPasswordInput: PasswordInput;
  @Input() confirmationPassword: FormControl;
  @Input() buyVoucher: BuyVoucher;
  @Input() data: VoucherDataForBuy;

  @Output() confirmationModeChanged = new EventEmitter<ConfirmationMode>();
  @Output() confirmed = new EventEmitter<string>();

  form: FormGroup;
  createDeviceConfirmation: () => CreateDeviceConfirmation;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.form = this.formBuilder.group({});
    this.form.setControl('confirmationPassword', this.confirmationPassword);

    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.BUY_VOUCHERS,
        amount: this.buyVoucher.amount,
        voucherType: this.data.type.id,
        numberOfVouchers: this.buyVoucher.count
      };
    };
    // When there's no confirmation password, the Enter key will confirm
    if (!this.confirmationPasswordInput) {
      this.addShortcut(Enter, () => this.confirmed.emit());
    }
  }

  labelOnTop(ltsm: boolean, field: CustomField): boolean {
    if (!ltsm) {
      return false;
    }
    const type = field ? field.type : null;
    return [CustomFieldTypeEnum.RICH_TEXT, CustomFieldTypeEnum.TEXT].includes(type);
  }
}
