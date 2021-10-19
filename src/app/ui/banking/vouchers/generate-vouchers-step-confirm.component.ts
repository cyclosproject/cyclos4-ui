import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CreateDeviceConfirmation, CustomField, CustomFieldTypeEnum, DeviceConfirmationTypeEnum, GenerateVoucher, PasswordInput, User, VoucherDataForGenerate, VoucherGenerationAmountEnum } from 'app/api/models';
import { FieldHelperService } from 'app/core/field-helper.service';
import { Enter } from 'app/core/shortcut.service';
import { BaseComponent } from 'app/shared/base.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';

@Component({
  selector: 'generate-vouchers-step-confirm',
  templateUrl: 'generate-vouchers-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateVouchersStepConfirmComponent extends BaseComponent implements OnInit {

  @Input() confirmationPasswordInput: PasswordInput;
  @Input() confirmationPassword: FormControl;
  @Input() generateVoucher: GenerateVoucher;
  @Input() data: VoucherDataForGenerate;
  @Input() user: User;

  @Output() confirmationModeChanged = new EventEmitter<ConfirmationMode>();
  @Output() confirmed = new EventEmitter<string>();

  showAmount: boolean;
  form: FormGroup;
  createDeviceConfirmation: () => CreateDeviceConfirmation;

  constructor(injector: Injector,
    public fieldHelper: FieldHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.showAmount = this.data.generationAmount === VoucherGenerationAmountEnum.GENERATION;

    this.form = this.formBuilder.group({});
    this.form.setControl('confirmationPassword', this.confirmationPassword);

    this.createDeviceConfirmation = () => {
      return {
        type: DeviceConfirmationTypeEnum.GENERATE_VOUCHERS,
        amount: this.generateVoucher.amount,
        voucherType: this.data.type.id,
        numberOfVouchers: this.generateVoucher.count,
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
