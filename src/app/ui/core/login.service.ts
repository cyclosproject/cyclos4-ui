import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, DataForFrontend, Permissions, User } from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { ConfirmationService } from 'app/core/confirmation.service';
import { NotificationService } from 'app/core/notification.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { NextRequestState } from 'app/core/next-request-state';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { empty } from 'app/shared/helper';
import { LoginState } from 'app/ui/core/login-state';
import { BehaviorSubject, Observable } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Service used to manage the login status
 */
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  user$ = new BehaviorSubject<User>(null);
  auth$ = new BehaviorSubject<Auth>(null);

  constructor(
    private dataForFrontendHolder: DataForFrontendHolder,
    private nextRequestState: NextRequestState,
    private authService: AuthService,
    private loginState: LoginState,
    private router: Router,
    @Inject(I18nInjectionToken) private i18n: I18n,
    private confirmation: ConfirmationService,
    private notification: NotificationService,
    private pushNotifications: PushNotificationsService) {

    // Whenever the data for ui changes, update the current status
    dataForFrontendHolder.subscribe(dataForFrontend => {
      const dataForUi = (dataForFrontend || {}).dataForUi;
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
    pushNotifications.loggedOut$.subscribe(() => this.confirmLogout());

    // Reload the data for UI whenever the permissions change
    pushNotifications.permissionsChanged$.subscribe(() =>
      this.dataForFrontendHolder.reload().pipe(first()).subscribe(() => {
        if (!ApiHelper.isRestrictedAccess(this.dataForFrontendHolder.dataForFrontend)) {
          // Navigate to the URL whenever there is not a restricted access otherwise it may give
          // PDE exceptions. Restricted access is handled by initialze.ts service
          this.router.navigateByUrl(this.router.url);
        }
      })
    );
  }

  public confirmLogout() {
    if (this.loginState.loggingOut) {
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
      this.i18n.initialized$.pipe(first()).subscribe(() => this.loggedOutConfirmation());
    }
  }

  private loggedOutConfirmation() {
    this.notification.close();
    this.confirmation.hide();
    this.confirmation.confirm({
      title: this.i18n.general.sessionExpired.title,
      message: this.i18n.general.sessionExpired.message,
      confirmLabel: this.i18n.general.sessionExpired.loginAgain,
      callback: () => {
        this.goToLoginPage(this.router.url);
      },
    });
  }

  /**
   * Returns the currently authenticated user
   */
  get user(): User {
    return this.user$.value;
  }

  /**
   * Redirects the user to the login page.
   * @param redirectUrl Where to go after logging in
   */
  goToLoginPage(redirectUrl: string) {
    const externalLoginUrl = this.dataForFrontendHolder.dataForFrontend.externalLoginUrl;
    if (externalLoginUrl) {
      // Login is handled in an external frontend
      let url = externalLoginUrl;
      if (!empty(redirectUrl)) {
        // Also send the path to return to after logging-in
        url += (url.includes('?') ? '&' : '?') + 'returnTo=' + encodeURIComponent(redirectUrl);
      }
      this.nextRequestState.willExternalRedirect();
      location.assign(url);
    } else {
      // Go to the login page
      this.dataForFrontendHolder.reload().pipe(first()).subscribe(() => {
        this.loginState.redirectUrl = redirectUrl;
        this.router.navigateByUrl('/login');
      });
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
   * Returns a cold observable for logging the user in the login.
   * Once logged in, will automatically redirect the user to the correct page.
   * @param principal The user principal
   * @param password The user password
   * @param identityProviderRequestId The requestId from the last identity provider callback, when there was no match.
   */
  login(principal: string, password: string, identityProviderRequestId?: string): Observable<DataForFrontend> {
    // Setup the basic authentication for the login request
    this.nextRequestState.nextAsBasic(principal, password);
    this.nextRequestState.addNextHeader('Principal-Type', '*');

    return this.authService.login({
      cookie: this.nextRequestState.useCookie,
      identityProviderRequestId,
      fields: ['sessionToken'],
    }).pipe(
      switchMap(auth => {
        // Store the session token
        this.nextRequestState.setSessionToken(auth.sessionToken);

        // Then reload the DataForFrontend instance (as user)
        return this.dataForFrontendHolder.reload();
      }));
  };

  /**
   * Directly clears the logged user state
   */
  clear(): void {
    this.loginState.redirectUrl = null;
    this.nextRequestState.setSessionToken(null);
  };

  /**
   * Performs the logout, optionally redirecting to a custom URL
   */
  logout(redirectUrl: string = null): void {
    this.loginState.redirectUrl = null;
    if (!this.nextRequestState.hasSession == null) {
      // No one logged in
      return;
    }
    this.loginState.loggingOut = true;
    this.nextRequestState.ignoreNextError = true;
    const handler = () => {
      const afterLogoutUrl = this.dataForFrontendHolder.dataForFrontend.afterLogoutUrl;
      if (afterLogoutUrl) {
        this.nextRequestState.willExternalRedirect();
        location.assign(afterLogoutUrl);
      } else {
        this.clear();

        // Then reload the DataForFrontend instance (as guest)
        return this.dataForFrontendHolder.reload().subscribe(() => {
          this.loginState.loggingOut = false;
          this.router.navigateByUrl(redirectUrl || '/');
        });
      }
    };
    this.authService.logout({
      cookie: this.nextRequestState.useCookie,
    }).subscribe(handler, handler);
  }
}
