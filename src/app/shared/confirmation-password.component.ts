import { Component, ChangeDetectionStrategy, Input, Provider, forwardRef, ViewChild, OnChanges } from '@angular/core';
import { PasswordInput, PasswordModeEnum } from 'app/api/models';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, ControlValueAccessor, AbstractControl, ValidationErrors } from '@angular/forms';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { GeneralMessages } from 'app/messages/general-messages';
import { Subscription } from 'rxjs';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const CONFIRMATION_PASSWORD_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ConfirmationPasswordComponent),
  multi: true
};

// Definition of the exported NG_VALIDATORS provider
export const CONFIRMATION_PASSWORD_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => ConfirmationPasswordComponent),
  multi: true
}

/**
 * Component used to input a password to confirm an action
 */
@Component({
  selector: 'confirmation-password',
  templateUrl: 'confirmation-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CONFIRMATION_PASSWORD_VALUE_ACCESSOR,
    CONFIRMATION_PASSWORD_VALIDATOR
  ]
})
export class ConfirmationPasswordComponent implements OnChanges, ControlValueAccessor, Validator {
  constructor(
    public generalMessages: GeneralMessages
  ) { }

  otpRenewable: boolean;

  @ViewChild("passwordComponent")
  private passwordComponent: PasswordInputComponent;

  private otpSubscription: Subscription;

  ngOnChanges() {
    if (this.otpSubscription == null && this.passwordComponent) {
      this.otpSubscription = this.passwordComponent.otpSent.subscribe(() => {
        this.passwordInput.hasActivePassword = true;
      });
    }
  }

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };
  private validatorChangeCallback = () => { };

  get disabled(): boolean {
    return this.passwordComponent == null ? false : this.passwordComponent.disabled;
  }
  set disabled(disabled: boolean)  {
    if (this.passwordComponent) this.passwordComponent.disabled = disabled;
  }

  private _password: string;
  get password(): string {
    return this._password;
  }
  set password(password: string) {
    this._password = password;
    this.changeCallback(password);
  }

  @Input()
  passwordInput: PasswordInput;

  get canConfirm(): boolean {
    return this.activePassword || this.hasOtpSendMediums;
  }  
  get activePassword(): boolean {
    return this.passwordInput.hasActivePassword;
  }
  get hasOtpSendMediums(): boolean {
    return this.passwordInput.mode == PasswordModeEnum.OTP
      && (this.passwordInput.otpSendMediums || []).length > 0;
  }

  get confirmationMessage(): string {
    let otp = this.passwordInput.mode == PasswordModeEnum.OTP;
    if (this.activePassword && !otp) {
      // The normal case is that the user has an active password. In that case, show no additional message.
      // However, for OTP it is possible to request a new password, so we do show a message in this case.
      return null;
    }
    let name = this.passwordInput.name;
    if (otp) {
      if (!this.hasOtpSendMediums) {
        return this.generalMessages.passwordConfirmationOtpNoMediums(name);
      } else if (this.activePassword) {
        return this.generalMessages.passwordConfirmationOtpExisting(name);
      } else {
        return this.generalMessages.passwordConfirmationOtp();
      }
    } else {
      return this.generalMessages.passwordConfirmationNotActive(name);
    }
  }

  // ControlValueAccessor methods
  writeValue(obj: any): void {
    this.password = obj;
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
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
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }
}