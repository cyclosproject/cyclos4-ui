import {
  Component, ChangeDetectionStrategy, Input, Provider, forwardRef,
  ViewChild, OnChanges, SkipSelf, Host, Optional
} from '@angular/core';
import { PasswordInput, PasswordModeEnum } from 'app/api/models';
import {
  NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator,
  AbstractControl, ValidationErrors, ControlContainer
} from '@angular/forms';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { GeneralMessages } from 'app/messages/general-messages';
import { Subscription } from 'rxjs/Subscription';
import { BaseControlComponent } from 'app/shared/base-control.component';

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
};

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
export class ConfirmationPasswordComponent extends BaseControlComponent<string> implements OnChanges, Validator {

  @Input() passwordInput: PasswordInput;

  otpRenewable: boolean;

  @ViewChild('passwordComponent')
  private passwordComponent: PasswordInputComponent;

  private otpSubscription: Subscription;

  private validatorChangeCallback = () => { };

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public generalMessages: GeneralMessages
  ) {
    super(controlContainer);
  }

  ngOnChanges() {
    if (this.otpSubscription == null && this.passwordComponent) {
      this.otpSubscription = this.passwordComponent.otpSent.subscribe(() => {
        this.passwordInput.hasActivePassword = true;
      });
    }
  }

  get canConfirm(): boolean {
    return this.activePassword || this.hasOtpSendMediums;
  }

  get activePassword(): boolean {
    return this.passwordInput.hasActivePassword;
  }

  get hasOtpSendMediums(): boolean {
    return this.passwordInput.mode === PasswordModeEnum.OTP
      && (this.passwordInput.otpSendMediums || []).length > 0;
  }

  get confirmationMessage(): string {
    const otp = this.passwordInput.mode === PasswordModeEnum.OTP;
    if (this.activePassword && !otp) {
      // The normal case is that the user has an active password. In that case, show no additional message.
      // However, for OTP it is possible to request a new password, so we do show a message in this case.
      return null;
    }
    const name = this.passwordInput.name;
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
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }
}
