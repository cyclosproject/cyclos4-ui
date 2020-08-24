import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { CreateDeviceConfirmation, DeviceConfirmationTypeEnum, GenerateVoucher, PasswordInput, VoucherDataForGenerate, User } from 'app/api/models';
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
}
