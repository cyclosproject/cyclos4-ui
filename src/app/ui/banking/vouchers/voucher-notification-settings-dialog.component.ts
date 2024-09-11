import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ChangeVoucherNotificationSettings,
  CreateDeviceConfirmation,
  DeviceConfirmationTypeEnum,
  VoucherActionEnum,
  VoucherCreationTypeEnum,
  VoucherView
} from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { BaseComponent } from 'app/shared/base.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * Changes the voucher notification settings in a dialog
 */
@Component({
  selector: 'voucher-notification-settings-dialog',
  templateUrl: 'voucher-notification-settings-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherNotificationSettingsDialogComponent extends BaseComponent implements OnInit {
  VoucherCreationTypeEnum = VoucherCreationTypeEnum;

  @Input() voucher: VoucherView;
  @Output() done = new EventEmitter<void>();

  showSubmit$ = new BehaviorSubject(true);
  form: FormGroup;

  constructor(injector: Injector, public modalRef: BsModalRef, private vouchersService: VouchersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({
      email: [this.voucher.email, Validators.email],
      mobilePhone: this.voucher.mobilePhone,
      enableNotifications: this.voucher.enableNotifications
    });
    if (this.voucher.confirmationPasswordInput) {
      this.form.addControl('confirmationPassword', new FormControl(null, Validators.required));
    }
    if (this.voucher.creationType === VoucherCreationTypeEnum.SENT) {
      // E-mail is required on sent vouchers
      this.form.controls.email.setValidators([Validators.required, Validators.email]);
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
    const params: ChangeVoucherNotificationSettings = { ...value };
    delete params['confirmationPassword'];

    this.addSub(
      this.vouchersService
        .changeVoucherNotificationSettings({
          key: this.voucher.id,
          confirmationPassword: value.confirmationPassword,
          body: params
        })
        .subscribe(() => {
          this.done.emit();
          this.modalRef.hide();
        })
    );
  }

  get createDeviceConfirmation(): () => CreateDeviceConfirmation {
    return () => ({
      type: DeviceConfirmationTypeEnum.MANAGE_VOUCHER,
      voucher: this.voucher.id,
      voucherAction: VoucherActionEnum.CHANGE_NOTIFICATION_SETTINGS
    });
  }
}
