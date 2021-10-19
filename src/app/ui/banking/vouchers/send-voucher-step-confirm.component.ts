import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  CreateDeviceConfirmation, CustomField, CustomFieldTypeEnum, DeviceConfirmationTypeEnum,
  PasswordInput, SendVoucher, VoucherDataForBuy
} from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { Enter } from 'app/core/shortcut.service';
import { BaseComponent } from 'app/shared/base.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';

@Component({
  selector: 'send-voucher-step-confirm',
  templateUrl: 'send-voucher-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendVoucherStepConfirmComponent extends BaseComponent implements OnInit {

  @Input() confirmationPasswordInput: PasswordInput;
  @Input() confirmationPassword: FormControl;
  @Input() sendVoucher: SendVoucher;
  @Input() data: VoucherDataForBuy;

  @Output() confirmationModeChanged = new EventEmitter<ConfirmationMode>();
  @Output() confirmed = new EventEmitter<string>();

  form: FormGroup;
  createDeviceConfirmation: () => CreateDeviceConfirmation;

  constructor(
    injector: Injector,
    public authHelper: AuthHelperService,
    public fieldHelper: FieldHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.form = this.formBuilder.group({});
    this.form.setControl('confirmationPassword', this.confirmationPassword);

    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.SEND_VOUCHER,
        amount: this.sendVoucher.amount,
        voucherType: this.data.type.id,
        email: this.sendVoucher.email,
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
