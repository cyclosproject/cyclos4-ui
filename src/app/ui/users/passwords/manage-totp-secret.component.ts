import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CreateDeviceConfirmation, DeviceConfirmationTypeEnum, OtpResult, SendMediumEnum, SendOtp, TotpSecretData, TotpStatusEnum } from 'app/api/models';
import { TotpService } from 'app/api/services/totp.service';
import { BaseComponent } from 'app/shared/base.component';
import { BehaviorSubject } from 'rxjs';
import QRCode from 'qrcode';
import { ConfirmationService } from 'app/core/confirmation.service';

/**
 * Manages the TOTP secret of a user
 */
@Component({
  selector: 'manage-totp-secret',
  templateUrl: 'manage-totp-secret.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageTotpSecretComponent
  extends BaseComponent
  implements OnInit {

  TotpStatusEnum = TotpStatusEnum;

  @Input() data: TotpSecretData;

  sendOtpControl = new FormControl();
  otpResult$ = new BehaviorSubject<OtpResult>(null);

  otpControl = new FormControl();

  @ViewChild('qrCodeCanvas') qrCodeCanvas: ElementRef<Element>;
  secretUrl$ = new BehaviorSubject<string>(null);
  totpControl = new FormControl();

  @Output() totpModified = new EventEmitter<void>();

  createDeviceConfirmation: () => CreateDeviceConfirmation;

  constructor(injector: Injector,
    private confirmation: ConfirmationService,
    private totpService: TotpService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.createDeviceConfirmation = this.createDeviceConfirmation = () => ({ type: DeviceConfirmationTypeEnum.REMOVE_TOTP_SECRET });
    if (this.data.secretUrl) {
      this.initializeQrCode(this.data.secretUrl);
    }
  }

  remove() {
    this.confirmation.confirm({
      message: this.i18n.password.totp.removeConfirmation,
      passwordInput: this.data.confirmationPasswordInput,
      createDeviceConfirmation: this.createDeviceConfirmation,
      callback: cb => this.addSub(this.totpService.deleteUserTotpSecret({
        user: this.data.user?.id,
        confirmationPassword: cb.confirmationPassword
      }).subscribe(() => {
        this.notification.snackBar(this.i18n.password.totp.removeDone);
        this.totpModified.emit();
      }))
    });
  }

  sendVerificationCode() {
    const sendOtp = this.sendOtpControl.value as SendOtp;
    if (sendOtp?.medium) {
      this.addSub(this.totpService.sendTotpSecretActivationCode({
        body: sendOtp
      }).subscribe(otpResult => {
        this.otpResult$.next(otpResult);
        this.notification.snackBar(otpResult.sendMedium === SendMediumEnum.SMS
          ? this.i18n.password.otp.sentToPhone(otpResult.sentTo)
          : this.i18n.password.otp.sentToEmail(otpResult.sentTo));
      }));
    }
  }

  cancelCode() {
    this.otpResult$.next(null);
  }

  verifyCode() {
    const otp = this.otpControl.value as string;
    if (otp?.length) {
      this.addSub(this.totpService.verifyTotpSecretActivationCode({
        body: otp
      }).subscribe(url => {
        this.initializeQrCode(url);
        this.notification.snackBar(this.i18n.password.totp.scanQr);
      }));
    }
  }

  private initializeQrCode(url: string) {
    this.secretUrl$.next(url);
    setTimeout(() => {
      if (this.qrCodeCanvas?.nativeElement) {
        QRCode.toCanvas(this.qrCodeCanvas.nativeElement, url, { errorCorrectionLevel: 'Q' });
      }
    });
  }

  activate() {
    const totp = this.totpControl.value as string;
    if (totp?.length) {
      this.addSub(this.totpService.activateTotpSecret({
        body: totp
      }).subscribe(() => {
        this.notification.snackBar(this.i18n.password.totp.activated);
        this.totpModified.emit(null);
      }));
    }
  }

  openAuthenticatorLink() {
    const url = this.secretUrl$.value;
    if (url) {
      window.location.assign(url);
    }
  }
}
