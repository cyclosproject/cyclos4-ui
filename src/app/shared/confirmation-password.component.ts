import { ChangeDetectionStrategy, Component, Host, Input, OnChanges, Optional, SkipSelf, ViewChild, OnInit } from '@angular/core';
import { AbstractControl, ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { PasswordInput, PasswordModeEnum } from 'app/api/models';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { Subscription } from 'rxjs';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';

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
export class ConfirmationPasswordComponent extends BaseControlComponent<string> implements OnInit, OnChanges, Validator {

  @Input() passwordInput: PasswordInput;

  canConfirm: boolean;
  confirmationMessage: string;
  otpRenewable: boolean;

  @ViewChild('passwordComponent') private passwordComponent: PasswordInputComponent;

  private otpSubscription: Subscription;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public i18n: I18n
  ) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.canConfirm = ApiHelper.canConfirm(this.passwordInput);
    this.confirmationMessage = ApiHelper.getConfirmationMessage(this.passwordInput, this.i18n);
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
}
