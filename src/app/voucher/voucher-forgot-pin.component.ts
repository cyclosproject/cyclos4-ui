import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SendMediumEnum } from 'app/api/models';
import { CaptchaHelperService } from 'app/core/captcha-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { validateBeforeSubmit } from 'app/shared/helper';
import { VoucherBasePageComponent } from 'app/voucher/voucher-base-page.component';

@Component({
  selector: 'voucher-forgot-pin',
  templateUrl: 'voucher-forgot-pin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherForgotPinComponent extends VoucherBasePageComponent implements OnInit {
  public form: FormGroup;

  constructor(
    private captchaHelper: CaptchaHelperService,
    private nextRequestState: NextRequestState,
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.captchaHelper.captchaFormGroup(this.state.forgotPinCaptchaInput);
    this.addEnterShortcut(() => this.confirm());
    this.addEscapeShortcut(() => this.back());
    this.state.title = this.i18n.voucher.info.forgotPin.title;
  }

  public message(): string {
    const mediums = this.state.voucher.forgotPinSendMediums;
    if (mediums.length == 1) {
      const mediumName =
        mediums[0] === SendMediumEnum.EMAIL ? this.i18n.general.sendMedium.email : this.i18n.general.sendMedium.sms;
      return this.i18n.voucher.info.forgotPin.message(mediumName);
    } else {
      const email = this.i18n.general.sendMedium.email;
      const sms = this.i18n.general.sendMedium.sms;
      return this.i18n.voucher.info.forgotPin.messageAllMediums({ email, sms });
    }
  }

  public confirm(): void {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }
    this.voucherService.resendVoucherInfoPin({ token: this.state.token, body: this.form.value }).subscribe(resp => {
      this.nextRequestState.leaveNotification = true;
      this.notification.info(this.i18n.voucher.info.forgotPin.pinSentTo(resp[0]));
      this.router.navigate(['pin']);
    });
  }

  public back(): void {
    history.back();
  }
}
