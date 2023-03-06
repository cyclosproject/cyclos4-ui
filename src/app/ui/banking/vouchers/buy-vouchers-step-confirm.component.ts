import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BuyVoucher, CreateDeviceConfirmation, CustomField, CustomFieldDetailed, CustomFieldTypeEnum, DeviceConfirmationTypeEnum, VoucherBuyingPreview } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { Enter } from 'app/core/shortcut.service';
import { BaseComponent } from 'app/shared/base.component';

@Component({
  selector: 'buy-vouchers-step-confirm',
  templateUrl: 'buy-vouchers-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyVouchersStepConfirmComponent extends BaseComponent implements OnInit {

  @Input() preview: VoucherBuyingPreview;
  @Input() paymentCustomFields: CustomFieldDetailed[];
  @Input() voucherCustomFields: CustomFieldDetailed[];

  @Input() confirmationPassword: FormControl;
  @Output() showSubmit = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<string>();

  buyVoucher: BuyVoucher;
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
    this.buyVoucher = this.preview.buyVoucher;

    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.BUY_VOUCHERS,
        amount: this.buyVoucher.amount,
        voucherType: this.preview.buyVoucher.type,
        numberOfVouchers: this.buyVoucher.count,
      };
    };
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
