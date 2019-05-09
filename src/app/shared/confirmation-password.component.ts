import {
  ChangeDetectionStrategy, Component, EventEmitter, Host, Input,
  OnChanges, OnInit, Optional, Output, SkipSelf, ViewChild, OnDestroy, Injector
} from '@angular/core';
import {
  AbstractControl, ControlContainer, FormControl,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator
} from '@angular/forms';
import {
  CreateDeviceConfirmation, PasswordInput, PasswordModeEnum,
  ImageSizeEnum, DeviceConfirmationView, DeviceConfirmationStatusEnum
} from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { empty } from 'app/shared/helper';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { Subscription, BehaviorSubject } from 'rxjs';
import { DeviceConfirmationsService } from 'app/api/services';
import { first } from 'rxjs/operators';
import { PushNotificationsService } from 'app/core/push-notifications.service';

/**
 * Component used to input a password to confirm an action
 */
@Component({
  selector: 'confirmation-password',
  templateUrl: 'confirmation-password.component.html',
  styleUrls: ['confirmation-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: ConfirmationPasswordComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: ConfirmationPasswordComponent, multi: true }
  ]
})
export class ConfirmationPasswordComponent extends BaseControlComponent<string> implements OnInit, OnDestroy, OnChanges, Validator {

  ConfirmationMode = ConfirmationMode;

  @Input() passwordInput: PasswordInput;
  @Input() createDeviceConfirmation: () => CreateDeviceConfirmation;
  @Output() confirmationModeChanged = new EventEmitter<ConfirmationMode>();
  @Output() confirmed = new EventEmitter<string>();

  canConfirm: boolean;
  allowDevice: boolean;
  allowPassword: boolean;
  confirmationMessage: string;
  otpRenewable: boolean;
  confirmationModeControl: FormControl;
  deviceConfirmationId: string;

  @ViewChild('passwordComponent') private passwordComponent: PasswordInputComponent;

  private otpSubscription: Subscription;

  currentUrl$ = new BehaviorSubject<string>(null);
  rejected$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private deviceConfirmationsService: DeviceConfirmationsService,
    private pushNotifications: PushNotificationsService,
    private authHelper: AuthHelperService
  ) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.canConfirm = this.authHelper.canConfirm(this.passwordInput);
    this.allowDevice = this.authHelper.canConfirmWithDevice(this.passwordInput);
    this.allowPassword = this.authHelper.canConfirmWithPassword(this.passwordInput);
    this.confirmationMessage = this.authHelper.getConfirmationMessage(this.passwordInput);
    this.confirmationModeControl = new FormControl(null);
    this.addSub(this.confirmationModeControl.valueChanges.subscribe(mode => {
      if (!this.deviceConfirmationId) {
        this.newQR();
      }
      this.confirmationModeChanged.emit(mode);
    }));

    this.addSub(this.pushNotifications.deviceConfirmations$.subscribe(c =>
      this.onDeviceConfirmation(c)));

    // Set the initial value for the confirmation mode
    setTimeout(() => {
      if (this.allowDevice) {
        this.confirmationModeControl.setValue(ConfirmationMode.Device);
      } else if (this.allowPassword) {
        this.confirmationModeControl.setValue(ConfirmationMode.Password);
      }
    }, 1);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.revokeCurrent();
  }

  ngOnChanges() {
    if (this.otpSubscription == null && this.passwordComponent) {
      this.otpSubscription = this.passwordComponent.otpSent.subscribe(() => {
        this.passwordInput.hasActivePassword = true;
      });
    }
  }

  get activePassword(): boolean {
    return this.passwordInput.hasActivePassword;
  }

  get hasOtpSendMediums(): boolean {
    return this.passwordInput.mode === PasswordModeEnum.OTP
      && !empty(this.passwordInput.otpSendMediums);
  }

  onDisabledChange(isDisabled: boolean) {
    if (this.passwordComponent) {
      this.passwordComponent.disabled = isDisabled;
    }
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (this.passwordComponent) {
      return this.passwordComponent.validate(c);
    }
    return null;
  }
  registerOnValidatorChange() {
  }

  focus() {
    this.passwordComponent.focus();
  }

  confirmWithKeyboard() {
    const value = this.value;
    if (!empty(value)) {
      this.confirmed.emit(value);
    }
  }

  newQR() {
    this.rejected$.next(false);
    this.deviceConfirmationsService.createDeviceConfirmation({
      body: this.createDeviceConfirmation()
    }).pipe(first())
      .subscribe(id => {
        this.deviceConfirmationId = id;
        this.deviceConfirmationsService.getDeviceConfirmationQrCode({ id: id, size: ImageSizeEnum.MEDIUM }).subscribe(blob => {
          this.revokeCurrent();
          this.currentUrl$.next(URL.createObjectURL(blob));
        });
      });
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
}
