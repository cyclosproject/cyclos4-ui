import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

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
    this._reason = redirectUrl ? LoginReason.LOGGED_OUT : LoginReason.NORMAL;
  }

  private _reason: LoginReason = LoginReason.NORMAL;
  get reason(): LoginReason {
    return this._reason;
  }

  private _loggingOut = new BehaviorSubject(false);
  get loggingOut(): boolean {
    return this._loggingOut.value;
  }
  set loggingOut(flag: boolean) {
    this._loggingOut.next(flag);
  }

  forgottenPasswordChanged(generated: boolean): void {
    this._reason = generated ? LoginReason.FORGOT_PASSWORD_GENERATED : LoginReason.FORGOT_PASSWORD_MANUAL;
  }

  /**
   * Adds a new observer notified when the logout process starts. The flag is cleared once the logout request is processed.
   */
  subscribeForLoggingOut(
    next?: (value: boolean) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Subscription {
    return this._loggingOut.subscribe(next, error, complete);
  }
}
