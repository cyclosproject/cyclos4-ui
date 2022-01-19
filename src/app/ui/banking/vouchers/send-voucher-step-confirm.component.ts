import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  CreateDeviceConfirmation, CustomField, CustomFieldDetailed, CustomFieldTypeEnum, DeviceConfirmationTypeEnum, SendVoucher, VoucherSendingPreview
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

  @Input() preview: VoucherSendingPreview;
  @Input() paymentCustomFields: CustomFieldDetailed[];
  @Input() voucherCustomFields: CustomFieldDetailed[];

  @Input() confirmationPassword: FormControl;
  @Output() confirmationModeChanged = new EventEmitter<ConfirmationMode>();
  @Output() confirmed = new EventEmitter<string>();

  sendVoucher: SendVoucher;
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
    this.sendVoucher = this.preview.sendVoucher;

    this.createDeviceConfirmation = () => ({
      type: DeviceConfirmationTypeEnum.SEND_VOUCHER,
      amount: this.sendVoucher.amount,
      voucherType: this.sendVoucher.type,
      email: this.sendVoucher.email,
    });
    // When there's no confirmation password, the Enter key will confirm
    if (!this.preview.confirmationPasswordInput) {
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
