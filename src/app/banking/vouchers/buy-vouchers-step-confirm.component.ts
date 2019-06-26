import { BaseComponent } from 'app/shared/base.component';
import { Component, ChangeDetectionStrategy, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PasswordInput, CreateDeviceConfirmation, DeviceConfirmationTypeEnum, BuyVoucher } from 'app/api/models';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmationMode } from 'app/shared/confirmation-mode';

@Component({
  selector: 'buy-vouchers-step-confirm',
  templateUrl: 'buy-vouchers-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyVouchersStepConfirmComponent extends BaseComponent implements OnInit {

  @Input() confirmationPasswordInput: PasswordInput;
  @Input() confirmationPassword: FormControl;
  @Input() buyVoucher: BuyVoucher;
  @Input() type: string;

  @Output() confirmationModeChanged = new EventEmitter<ConfirmationMode>();
  @Output() confirmed = new EventEmitter<string>();

  form: FormGroup;
  createDeviceConfirmation: () => CreateDeviceConfirmation;

  ngOnInit() {
    super.ngOnInit();

    this.form = this.formBuilder.group({});
    this.form.setControl('confirmationPassword', this.confirmationPassword);

    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.BUY_VOUCHERS,
        amount: this.buyVoucher.amount,
        voucherType: this.type,
        numberOfVouchers: this.buyVoucher.count
      };
    };
  }
}
