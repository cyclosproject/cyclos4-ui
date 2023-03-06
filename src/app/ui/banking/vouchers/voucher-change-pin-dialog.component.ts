import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ChangeVoucherPin, CreateDeviceConfirmation, DeviceConfirmationTypeEnum, VoucherActionEnum, VoucherCreationTypeEnum, VoucherView } from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';


/** Validator function that ensures password and confirmation match */
const PINS_MATCH_VAL: ValidatorFn = control => {
  const currVal = control.value;
  if (control.touched && currVal != null && currVal !== '') {
    const parent = control.parent;
    const origVal = parent.get('newPin') == null ? '' : parent.get('newPin').value;
    if (origVal !== currVal) {
      return {
        passwordsMatch: true,
      };
    }
  }
  return null;
};

/**
 * Changes the voucher PIN in a dialog
 */
@Component({
  selector: 'voucher-change-pin-dialog',
  templateUrl: 'voucher-change-pin-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherChangePinDialogComponent extends BaseComponent implements OnInit {

  VoucherCreationTypeEnum = VoucherCreationTypeEnum;

  @Input() voucher: VoucherView;
  @Output() done = new EventEmitter<void>();

  showSubmit$ = new BehaviorSubject(true);
  form: FormGroup;

  constructor(
    injector: Injector,
    public modalRef: BsModalRef,
    private vouchersService: VouchersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({
      newPin: [null, [Validators.required,
      Validators.minLength(this.voucher.pinInput?.minLength ?? 6),
      Validators.maxLength(this.voucher.pinInput?.maxLength ?? 6)
      ]],
      newPinConfirmation: [null, [Validators.required, PINS_MATCH_VAL]]
    });
    if (this.voucher.requireOldPinForChange) {
      this.form.addControl('oldPin', new FormControl(null, Validators.required));
    } else if (this.voucher.confirmationPasswordInput) {
      // Confirmation password isn't used when the old PIN is requested
      this.form.addControl('confirmationPassword', new FormControl(null, Validators.required));
    }
  }

  submit(confirmationPassword?: string) {
    if (confirmationPassword) {
      this.form.patchValue({ confirmationPassword });
    }
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    const value = this.form.value;
    const params: ChangeVoucherPin = { ...value };
    delete params['confirmationPassword'];

    this.addSub(this.vouchersService.changeVoucherPin({
      key: this.voucher.id,
      confirmationPassword: value.confirmationPassword,
      body: params,
    }).subscribe(() => {
      this.done.emit();
      this.modalRef.hide();
    }));
  }

  get createDeviceConfirmation(): () => CreateDeviceConfirmation {
    return () => ({
      type: DeviceConfirmationTypeEnum.MANAGE_VOUCHER,
      voucher: this.voucher.id,
      voucherAction: VoucherActionEnum.CHANGE_PIN
    });
  }
}
