import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';

/**
 * The possible reasons for the user to be taken to the login page
 */
export enum LoginReason {
  NORMAL,
  LOGGED_OUT,
  FORGOT_PASSWORD_GENERATED,
  FORGOT_PASSWORD_MANUAL
}

/**
 * Stores data for the login page
 */
@Injectable({
  providedIn: 'root'
})
export class LoginState {

  private _redirectUrl: string;

  get redirectUrl(): string {
    return this._redirectUrl;
  }

  set redirectUrl(redirectUrl: string) {
    if (redirectUrl && redirectUrl.startsWith('/login')) {
      // Avoid infinite loop if it is login
      redirectUrl = null;
    }
    this._redirectUrl = redirectUrl;
    this._reason = redirectUrl == null ? LoginReason.NORMAL : LoginReason.LOGGED_OUT;
  }

  private _reason: LoginReason = LoginReason.NORMAL;

  get reason(): LoginReason {
    return this._reason;
  }

  forgottenPasswordChanged(generated: boolean): void {
    this._reason = generated ? LoginReason.FORGOT_PASSWORD_GENERATED : LoginReason.FORGOT_PASSWORD_MANUAL;
  }
}
