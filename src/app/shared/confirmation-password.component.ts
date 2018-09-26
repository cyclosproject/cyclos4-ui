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
import { Subscription } from 'rxjs';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { I18n } from '@ngx-translate/i18n-polyfill';

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
export class ConfirmationPasswordComponent extends BaseControlComponent<string> implements OnChanges, Validator {

  @Input() passwordInput: PasswordInput;

  otpRenewable: boolean;

  @ViewChild('passwordComponent')
  private passwordComponent: PasswordInputComponent;

  private otpSubscription: Subscription;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public i18n: I18n
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
        return this.i18n(`In order to confirm you need a {{name}}, but you cannot request a new password.
          Please, contact the administration.`, {
            name: name
          });
      } else if (this.activePassword) {
        return this.i18n(`In order to confirm, please, supply your {{name}}.
          You can use the previously sent password or request for a new one.`, {
            name: name
          });
      } else {
        return this.i18n('Please, request a password below in order to confirm.');
      }
    } else {
      return this.i18n(`In order to confirm you need a {{name}}, but you do not have any.`, {
        name: name
      });
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
  }

  focus() {
    this.passwordComponent.focus();
  }
}
