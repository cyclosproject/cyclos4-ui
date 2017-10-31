import { Injectable } from '@angular/core';
import { Auth, User } from "app/api/models";
import { RequestOptions } from "@angular/http";
import { AuthService } from "app/api/services/auth.service";
import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";
import { NotificationService } from "app/core/notification.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { ApiConfigurationService } from "app/core/api-configuration.service";
import { Router } from "@angular/router";
import { GeneralMessages } from 'app/messages/general-messages';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Service used to manage the login status
 */
@Injectable()
export class LoginService {
  private _auth: Auth;

  private onAuth: Subject<Auth> = new Subject();

  public redirectUrl: string;

  constructor(
    private apiConfigurationService: ApiConfigurationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private errorHandlerService: ErrorHandlerService,
    private router: Router) {
  }

  /**
   * Adds a new observer notified when the user logs-in (auth != null) or logs out (auth == null)
   */
  subscribeForAuth(next?: (value: Auth) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.onAuth.subscribe(next, error, complete);
  }

  /**
   * Returns the currently authenticated user
   */
  get user(): User {
    return this._auth == null ? null : this._auth.user;
  }

  /**
   * Returns the current authentication
   */
  get auth(): Auth {
    return this._auth;
  }

  /**
   * Sets the current authentication
   */
  set auth(auth: Auth) {
    this._auth = auth;
    this.onAuth.next(auth);
  }

  /**
   * Performs the login
   * @param principal The user principal
   * @param password The user password
   */
  login(principal: string, password): Promise<Auth> {
    // Setup the basic authentication for the login request
    this.apiConfigurationService.nextAsBasic(principal, password);
    // Then attempt to do the login
    return this.authService.login({
      fields: ApiHelper.excludedAuthFields
    })
      .then(response => {
        // Prepare the API configuration to pass the session token
        let auth = response.data;
        this.apiConfigurationService.sessionToken = auth.sessionToken;
        this.auth = auth;
        return auth;
      });
  }

  /**
   * Directly clears the logged user state
   */
  clear(): void {
    this.redirectUrl = null;
    this.apiConfigurationService.sessionToken = null;
    this.auth = null;
  }

  /**
   * Performs the logout
   */
  logout(): Promise<void> {
    this.redirectUrl = null;
    if (this._auth == null) {
      // No one logged in
      return Promise.resolve();
    }
    return this.authService.logout()
      .then(response => {
        this.clear();
        this.router.navigateByUrl('/login');
        return null;
      });
  }

}