import { Injectable } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { PasswordInput, PasswordModeEnum } from 'app/api/models';
import { empty } from 'app/shared/helper';
import { NextRequestState } from 'app/core/next-request-state';
import { FormBuilder, Validators } from '@angular/forms';

/**
 * Helper service for authentication / password common functions
 */
@Injectable({
  providedIn: 'root'
})
export class AuthHelperService {

  constructor(
    private i18n: I18n,
    private nextRequestState: NextRequestState,
    private formBuilder: FormBuilder) {
  }

  /**
   * Returns whether the given password input is enabled for confirmation.
   * That means: if the password is an OTP, needs valid mediums to send.
   * Otherwise, there must have an active password.
   * If passwordInput is null it is assumed that no confirmation password is needed, hence, can confirm.
   */
  canConfirm(passwordInput: PasswordInput): boolean {
    if (passwordInput == null || passwordInput.hasActivePassword) {
      return true;
    }
    if (passwordInput.mode === PasswordModeEnum.OTP) {
      return (passwordInput.otpSendMediums || []).length > 0;
    }
    return false;
  }

  /**
   * Returns the message that should be presented to users in case a confirmation password cannot be used
   */
  getConfirmationMessage(passwordInput: PasswordInput) {
    if (passwordInput == null) {
      return null;
    }
    const otp = passwordInput.mode === PasswordModeEnum.OTP;
    const activePassword = passwordInput.hasActivePassword;
    const hasOtpSendMediums = passwordInput.mode === PasswordModeEnum.OTP && !empty(passwordInput.otpSendMediums);

    if (activePassword && !otp) {
      // The normal case is that the user has an active password. In that case, show no additional message.
      // However, for OTP it is possible to request a new password, so we do show a message in this case.
      return null;
    }
    const name = passwordInput.name;
    if (otp) {
      if (!hasOtpSendMediums) {
        return this.i18n(`In order to confirm you need a {{name}}, but you cannot request a new password.
          Please, contact the administration.`, {
            name: name
          });
      } else if (activePassword) {
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

  /**
   * Returns the fields that should be excluded when fetching the Auth model.
   * Contains both deprecated and unused fields.
   */
  excludedAuthFields(prefix: string): string[] {
    const actualPrefix = prefix == null ? '' : prefix + '.';
    return [
      `-${actualPrefix}permissions.records`,
      `-${actualPrefix}permissions.systemRecords`,
      `-${actualPrefix}permissions.userRecords`,
      `-${actualPrefix}permissions.operations`,
      `-${actualPrefix}permissions.accounts`,
    ];
  }

  /**
   * Returns a form that has a captcha challenge and response
   * @param formBuilder The form builder
   */
  captchaFormGroup() {
    return this.formBuilder.group({
      challenge: ['', Validators.required],
      response: ['', Validators.required]
    });
  }

  /**
   * Appends the session token to the given URL
   * @param url The base URL
   * @param nextRequestState The next request state
   */
  appendAuth(url: string): string {
    const sessionToken = this.nextRequestState.sessionToken;
    if (sessionToken == null || sessionToken === '') {
      return url;
    }
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 'Session-Token=' + sessionToken;
  }

}
