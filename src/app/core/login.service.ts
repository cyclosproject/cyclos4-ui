import { Injectable, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Auth, Permissions, User } from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LoginState } from 'app/core/login-state';
import { NextRequestState } from 'app/core/next-request-state';
import { empty, isSameOrigin } from 'app/shared/helper';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';
import { Configuration } from 'app/configuration';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { NotificationService } from 'app/core/notification.service';
import { I18n } from 'app/i18n/i18n';

/**
 * Service used to manage the login status
 */
@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private _loggingOut = new BehaviorSubject(false);
  user$ = new BehaviorSubject<User>(null);
  auth$ = new BehaviorSubject<Auth>(null);

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private nextRequestState: NextRequestState,
    private authService: AuthService,
    private loginState: LoginState,
    private router: Router,
    private i18n: I18n,
    private notification: NotificationService,
    private pushNotifications: PushNotificationsService,
    private apiConfiguration: ApiConfiguration) {

    // Whenever the data for ui changes, update the current status
    dataForUiHolder.subscribe(dataForUi => {
      const auth = (dataForUi || {}).auth;
      const user = (auth || {}).user;
      this.auth$.next(auth);
      this.user$.next(user);
      if (user) {
        this.pushNotifications.open();
      } else {
        this.pushNotifications.close();
      }
    });

    // Whenever the user is logged out, clear the status
    pushNotifications.loggedOut$.subscribe(() => {
      if (this._loggingOut.value) {
        // In the middle of a logout
        return;
      }
      this.clear();
      this.nextRequestState.setSessionToken(null);

      // Also ask the user if they want to login again
      if (this.i18n.initialized$.value) {
        // The translations are initialized, confirm whether to login again
        this.loggedOutConfirmation();
      } else {
        // As soon as translations are initialized, confirm whether to login again
        this.i18n.initialized$.pipe(first()).subscribe(() => this.loggedOutConfirmation);
      }
    });
  }

  private loggedOutConfirmation() {
    this.notification.confirm({
      title: this.i18n.general.sessionExpired.title,
      message: this.i18n.general.sessionExpired.message,
      confirmLabel: this.i18n.general.sessionExpired.loginAgain,
      callback: () => {
        this.goToLoginPage(this.router.url);
      }
    });
  }

  /**
   * Returns the currently authenticated user
   */
  get user(): User {
    return this.user$.value;
  }

  /**
   * Adds a new observer notified when the logout process starts. The flag is cleared once the logout request is processed.
   */
  subscribeForLoggingOut(next?: (value: boolean) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this._loggingOut.subscribe(next, error, complete);
  }

  /**
   * Redirects the user to the login page.
   * @param redirectUrl Where to go after logging in
   */
  goToLoginPage(redirectUrl: string) {
    if (Configuration.externalLoginUrl) {
      // Login is handled in an external frontend
      let url = Configuration.externalLoginUrl;
      if (Configuration.externalLoginParam && !empty(redirectUrl)) {
        // Also send the redirect url
        url += (url.includes('?') ? '&' : '?') + Configuration.externalLoginParam + '=' + encodeURIComponent(redirectUrl);
      }
      location.assign(url);
    } else {
      // Go to the login page
      this.loginState.redirectUrl = redirectUrl;
      this.router.navigateByUrl('/login');
    }
  }

  /**
   * Returns the current user permissions, or null if not logged in
   */
  get permissions(): Permissions {
    const auth = this.auth;
    return auth == null ? null : auth.permissions;
  }

  /**
   * Returns the current authentication
   */
  get auth(): Auth {
    return this.auth$.value;
  }

  /**
   * Returns a key used for guests to upload temporary images / files
   */
  get guestKey(): string {
    if (this.user != null) {
      return '';
    }
    const name = 'GuestKey';
    let key = localStorage.getItem(name);
    if (empty(key)) {
      key = `${new Date().getTime()}_${Math.random() * Number.MAX_SAFE_INTEGER}`;
      localStorage.setItem(name, key);
    }
    return key;
  }

  /**
   * Returns whether the service is in the process of logging out
   */
  get loggingOut(): boolean {
    return this._loggingOut.value;
  }

  /**
   * Returns a cold observable for logging the user in the login.
   * Once logged in, will automatically redirect the user to the correct page.
   * @param principal The user principal
   * @param password The user password
   */
  login(principal: string, password: string): Observable<Auth> {
    // Setup the basic authentication for the login request
    this.nextRequestState.nextAsBasic(principal, password);
    const useCookie = isSameOrigin(this.apiConfiguration.rootUrl) && !isDevMode();

    return this.authService.login({
      cookie: useCookie,
      fields: ['sessionToken']
    }).pipe(
      switchMap(auth => {
        // Store the session token
        this.nextRequestState.setSessionToken(auth.sessionToken, useCookie);

        // Then reload the DataForUi instance (as user)
        return this.dataForUiHolder.reload().pipe(
          map(dataForUi => dataForUi.auth)
        );
      }));
  }

  /**
   * Directly clears the logged user state
   */
  clear(): void {
    this.loginState.redirectUrl = null;
    this.nextRequestState.setSessionToken(null);
  }

  /**
   * Performs the logout, optionally redirecting to a custom URL
   */
  logout(redirectUrl: string = null): void {
    this.loginState.redirectUrl = null;
    if (!this.nextRequestState.hasSession == null) {
      // No one logged in
      return;
    }
    this._loggingOut.next(true);
    this.authService.logout({
      cookie: isSameOrigin(this.apiConfiguration.rootUrl)
    }).subscribe(() => {
      if (Configuration.afterLogoutUrl) {
        location.assign(Configuration.afterLogoutUrl);
      } else {
        this.clear();

        // Then reload the DataForUi instance (as guest)
        return this.dataForUiHolder.reload().subscribe(() => {
          this._loggingOut.next(false);
          this.router.navigateByUrl(redirectUrl || '/');
        });
      }
    });
  }
}
