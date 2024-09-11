import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { VoucherStatusEnum } from 'app/api/models';
import { validateBeforeSubmit } from 'app/shared/helper';
import { VoucherBasePageComponent } from 'app/voucher/voucher-base-page.component';

/**
 * Component used to input the PIN of a voucher
 */
@Component({
  selector: 'voucher-pin',
  templateUrl: 'voucher-pin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherPinComponent extends VoucherBasePageComponent implements OnInit {
  pin: FormControl;
  VoucherStatus: VoucherStatusEnum;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.pin = new FormControl(null, Validators.required);

    // Add shortcuts
    this.addEscapeShortcut(() => this.state.exit());

    // Set page title
    this.state.title = this.i18n.voucher.info.title;
  }

  isBlocked() {
    return this.state?.voucher?.status === VoucherStatusEnum.BLOCKED;
  }

  message() {
    return this.isBlocked() ? this.i18n.voucher.info.messagePinBlockedVoucher : this.i18n.voucher.info.messagePin;
  }

  proceed() {
    if (this.state.processing$.value) {
      return;
    }
    if (!validateBeforeSubmit(this.pin)) {
      return;
    } else if (this.isBlocked()) {
      this.voucherService.unblockVoucherInfo({ token: this.state.token, pin: this.pin.value }).subscribe(_resp => {
        this.state.fetchWithPin(this.pin.value);
      });
    } else {
      this.state.fetchWithPin(this.pin.value);
    }
  }

  forgotPin() {
    this.router.navigate(['forgot-pin']);
  }
}
