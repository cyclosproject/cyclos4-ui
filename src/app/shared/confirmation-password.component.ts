import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Host,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SkipSelf,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import {
  CreateDeviceConfirmation,
  CredentialTypeEnum,
  DeviceConfirmationStatusEnum,
  DeviceConfirmationView,
  ImageSizeEnum,
  PasswordInput,
  PasswordInputMethodEnum,
  PasswordModeEnum,
  PaymentPreview,
  PerformPayment
} from 'app/api/models';
import { DeviceConfirmationsService } from 'app/api/services/device-confirmations.service';
import { PosService } from 'app/api/services/pos.service';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { LayoutService } from 'app/core/layout.service';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Component used to input a password to confirm an action.
 */
@Component({
  selector: 'confirmation-password',
  templateUrl: 'confirmation-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: ConfirmationPasswordComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: ConfirmationPasswordComponent, multi: true }
  ]
})
export class ConfirmationPasswordComponent
  extends BaseControlComponent<string>
  implements OnInit, OnDestroy, AfterViewInit, Validator
{
  PasswordInputMethodEnum = PasswordInputMethodEnum;
  CredentialTypeEnum = CredentialTypeEnum;

  @Input() paymentPreview: PaymentPreview;
  @Input() pos: boolean;
  @Input() passwordInput: PasswordInput;
  @Input() createDeviceConfirmation: () => CreateDeviceConfirmation | PerformPayment;
  @Output() showSubmit = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<string>();
  @Output() createDeviceConfirmationError = new EventEmitter<HttpErrorResponse>();
  @Input() alertMessage: string;

  otpSent: boolean;
  canConfirm: boolean;
  allowDevice: boolean;
  allowTotp: boolean;
  allowPassword: boolean;
  confirmationMessage$ = new BehaviorSubject<string>(null);
  credentialTypeControl: FormControl;
  credentialTypeOptions: FieldOption[];
  deviceConfirmationId: string;

  totpControl = new FormControl();

  @ViewChild('passwordComponent') private passwordComponent: PasswordInputComponent;

  private otpSubscription: Subscription;

  currentUrl$ = new BehaviorSubject<string>(null);
  rejected$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private posService: PosService,
    private deviceConfirmationsService: DeviceConfirmationsService,
    private pushNotifications: PushNotificationsService,
    public authHelper: AuthHelperService,
    public layout: LayoutService
  ) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.canConfirm = this.authHelper.canConfirm(this.passwordInput);
    this.allowDevice = this.authHelper.canConfirm(this.passwordInput, CredentialTypeEnum.DEVICE);
    this.allowTotp = this.authHelper.canConfirm(this.passwordInput, CredentialTypeEnum.TOTP);
    this.allowPassword = this.authHelper.canConfirm(this.passwordInput, CredentialTypeEnum.PASSWORD);
    this.updateConfirmationMessage(null);
    const credentialType = this.authHelper.initialCredentialType(this.passwordInput);
    if (credentialType == CredentialTypeEnum.DEVICE) {
      this.newQR();
    }
    this.credentialTypeControl = new FormControl(credentialType);
    if (this.passwordInput.allowedCredentials.length > 1) {
      this.credentialTypeOptions = this.passwordInput.allowedCredentials.map(
        ct =>
          ({
            value: ct,
            text: this.authHelper.credentialTypeLabel(this.passwordInput, ct),
            disabled: !this.passwordInput.activeCredentials.includes(ct)
          } as FieldOption)
      );
    }
    this.addSub(
      this.credentialTypeControl.valueChanges.subscribe(credentialType => {
        if (credentialType === CredentialTypeEnum.DEVICE && !this.deviceConfirmationId) {
          this.newQR();
        }
        this.formControl.setValue(null);
        this.updateConfirmationMessage(credentialType);
        this.emitShowSubmit(credentialType);
      })
    );
    this.addSub(this.pushNotifications.deviceConfirmations$.subscribe(c => this.onDeviceConfirmation(c)));

    this.addSub(
      this.totpControl.valueChanges.subscribe(totp => {
        totp = (totp || '').trim();
        this.formControl.setValue(totp.length ? `totp:${totp}` : '');
      })
    );

    // Update the initial status
    setTimeout(() => {
      this.updateConfirmationMessage(credentialType);
      this.emitShowSubmit(credentialType);
    });
  }

  private emitShowSubmit(credentialType: CredentialTypeEnum) {
    this.showSubmit.emit(this.authHelper.showSubmit(this.passwordInput, credentialType, this.otpSent));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.revokeCurrent();
  }

  ngAfterViewInit() {
    if (this.otpSubscription == null && this.passwordComponent) {
      this.otpSubscription = this.passwordComponent.otpSent.subscribe(() => {
        if (this.passwordInput.passwordType.allowReuseOtp) {
          this.passwordInput.hasReusableOtp = true;
        }
        this.otpSent = true;
        this.showSubmit.emit(this.authHelper.showSubmit(this.passwordInput, CredentialTypeEnum.PASSWORD, true));
        this.updateConfirmationMessage(CredentialTypeEnum.PASSWORD);
      });
    }
  }

  get confirmPasswordPlaceholder(): string {
    return this.i18n.password.confirmPasswordPlaceholder(this.passwordInput.passwordType?.name);
  }

  get activePassword(): boolean {
    return this.passwordInput.activeCredentials?.includes(CredentialTypeEnum.PASSWORD);
  }

  get hasOtpSendMediums(): boolean {
    return this.passwordInput?.passwordType?.mode === PasswordModeEnum.OTP && !empty(this.passwordInput.otpSendMediums);
  }

  onDisabledChange(isDisabled: boolean) {
    if (this.passwordComponent) {
      this.passwordComponent.disabled = isDisabled;
    }
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (this.credentialTypeControl.value === CredentialTypeEnum.PASSWORD && this.passwordComponent) {
      return this.passwordComponent.validate(c);
    }
    return null;
  }
  registerOnValidatorChange() {
    // Do nothing
  }

  focus() {
    if (this.passwordComponent) {
      this.passwordComponent.focus();
    }
  }

  confirmWithKeyboard() {
    const value = this.value;
    if (!empty(value)) {
      this.confirmed.emit(value);
    }
  }

  newQR() {
    this.rejected$.next(false);
    let request: Observable<string>;
    if (this.pos) {
      request = this.posService.receivePaymentCreateDeviceConfirmation({
        body: this.createDeviceConfirmation() as PerformPayment
      });
    } else {
      request = this.deviceConfirmationsService.createDeviceConfirmation({
        body: this.createDeviceConfirmation() as CreateDeviceConfirmation
      });
    }
    request.pipe(first()).subscribe(
      id => {
        this.deviceConfirmationId = id;
        let qrReq: Observable<Blob>;
        if (this.pos) {
          const perform = this.createDeviceConfirmation() as PerformPayment;
          qrReq = this.posService.receivePaymentDeviceConfirmationQrCode({
            id,
            payer: perform.subject,
            size: ImageSizeEnum.MEDIUM
          });
        } else {
          qrReq = this.deviceConfirmationsService.getDeviceConfirmationQrCode({
            id,
            size: ImageSizeEnum.MEDIUM
          });
        }
        qrReq.pipe(first()).subscribe(blob => {
          this.revokeCurrent();
          this.currentUrl$.next(URL.createObjectURL(blob));
        });
      },
      error => {
        this.createDeviceConfirmationError.emit(error);
      }
    );
  }

  private revokeCurrent() {
    const url = this.currentUrl$.value;
    if (url) {
      URL.revokeObjectURL(url);
      this.currentUrl$.next(null);
    }
  }

  private onDeviceConfirmation(confirmation: DeviceConfirmationView) {
    if ((confirmation || {}).id !== this.deviceConfirmationId) {
      // Some other confirmation - ignore it
      return;
    }
    switch (confirmation.status) {
      case DeviceConfirmationStatusEnum.APPROVED:
        // Notify that the confirmation is approved
        this.confirmed.emit(`confirmation:${confirmation.id}`);
        break;
      case DeviceConfirmationStatusEnum.REJECTED:
        // Invalidate the current confirmation
        this.deviceConfirmationId = null;
        this.rejected$.next(true);
        break;
    }
  }

  private updateConfirmationMessage(credentialType: CredentialTypeEnum) {
    this.confirmationMessage$.next(
      this.authHelper.getConfirmationMessage(this.passwordInput, credentialType, this.pos)
    );
  }
}
