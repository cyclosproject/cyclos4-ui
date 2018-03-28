import { Injectable } from '@angular/core';
import { Auth, User } from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NextRequestState } from 'app/core/next-request-state';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';

export enum LoginPageState {
  NORMAL,
  LOGGED_OUT,
  FORGOT_PASSWORD_GENERATED,
  FORGOT_PASSWORD_MANUAL
}

/**
 * Service used to manage the login status
 */
@Injectable()
export class LoginService {
  private _loggingOut = new BehaviorSubject(false);

  private _redirectUrl: string;

  get redirectUrl(): string {
    return this._redirectUrl;
  }

  set redirectUrl(redirectUrl: string) {
    this._redirectUrl = redirectUrl;
    this._loginPageState = redirectUrl == null ? LoginPageState.NORMAL : LoginPageState.LOGGED_OUT;
  }

  private _loginPageState: LoginPageState = LoginPageState.NORMAL;

  get loginPageState(): LoginPageState {
    return this._loginPageState;
  }

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private nextRequestState: NextRequestState,
    private authService: AuthService,
    private router: Router) {
  }

  /**
   * Adds a new observer notified when the logout process starts. The flag is cleared once the logout request is processed.
   */
  subscribeForLoggingOut(next?: (value: boolean) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this._loggingOut.subscribe(next, error, complete);
  }

  /**
   * Returns the currently authenticated user
   */
  get user(): User {
    const auth = this.auth;
    return auth == null ? null : auth.user;
  }

  /**
   * Returns the current authentication
   */
  get auth(): Auth {
    const dataForUi = this.dataForUiHolder.dataForUi;
    return dataForUi == null ? null : dataForUi.auth;
  }

  /**
   * Returns whether the service is in the process of logging out
   */
  get loggingOut(): boolean {
    return this._loggingOut.value;
  }

  /**
   * Performs the login, returning a Promise with the session token.
   * Once logged in, will automatically redirect the user to the correct page.
   * @param principal The user principal
   * @param password The user password
   */
  login(principal: string, password): Promise<string> {
    // Setup the basic authentication for the login request
    this.nextRequestState.nextAsBasic(principal, password);
    // Then attempt to do the login
    return this.authService.login({
      fields: ['sessionToken']
    }).toPromise()
      .then(auth => {
        // Store the session token
        this.nextRequestState.sessionToken = auth.sessionToken;

        // Then reload the DataForUi instance (as user)
        return this.dataForUiHolder.reload()
          .then(() => {
            // Redirect to the correct URL
            this.router.navigateByUrl(this.redirectUrl || '');
            return auth.sessionToken;
          });
      });
  }

  /**
   * Directly clears the logged user state
   */
  clear(): void {
    this.redirectUrl = null;
    this.nextRequestState.sessionToken = null;
  }

  /**
   * Performs the logout, optionally redirecting to a custom URL
   */
  logout(redirectUrl: string = null): void {
    this.redirectUrl = null;
    if (this.auth == null) {
      // No one logged in
      return;
    }
    this._loggingOut.next(true);
    this.authService.logout()
      .toPromise()
      .then(() => {
        this.clear();

        // Then reload the DataForUi instance (as guest)
        return this.dataForUiHolder.reload()
          .then(() => {
            this._loggingOut.next(false);
            this.router.navigateByUrl(redirectUrl || '/login');
            return null;
          });
      });
  }

  forgottenPasswordChanged(generated: boolean): void {
    this._loginPageState = generated ? LoginPageState.FORGOT_PASSWORD_GENERATED : LoginPageState.FORGOT_PASSWORD_MANUAL;
  }
}
