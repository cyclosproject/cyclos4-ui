import { Injectable } from '@angular/core';
import { Auth, User } from "app/api/models";
import { RequestOptions } from "@angular/http";
import { AuthService } from "app/api/services/auth.service";
import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";
import { NotificationService } from "app/core/notification.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { Router } from "@angular/router";
import { GeneralMessages } from 'app/messages/general-messages';
import { ApiHelper } from 'app/shared/api-helper';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators';

/**
 * Service used to manage the login status
 */
@Injectable()
export class LoginService {
  private _auth: Auth;

  private onAuth: Subject<Auth> = new Subject();

  public redirectUrl: string;

  constructor(
    private apiInterceptor: ApiInterceptor,
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
   * Returns a cold observable that performs the login
   * @param principal The user principal
   * @param password The user password
   */
  login(principal: string, password): Observable<Auth> {
    // Setup the basic authentication for the login request
    this.apiInterceptor.nextAsBasic(principal, password);
    // Then attempt to do the login
    return this.authService.login({
      fields: ApiHelper.excludedAuthFields
    }).pipe(
      tap(auth => {
        // Prepare the API configuration to pass the session token
        this.apiInterceptor.sessionToken = auth.sessionToken;
        this.auth = auth;
      })
    );
  }

  /**
   * Directly clears the logged user state
   */
  clear(): void {
    this.redirectUrl = null;
    this.apiInterceptor.sessionToken = null;
    this.auth = null;
  }

  /**
   * Performs the logout
   */
  logout(): Observable<void> {
    this.redirectUrl = null;
    if (this._auth == null) {
      // No one logged in
      return Observable.create();
    }
    let observable = this.authService.logout();
    observable.subscribe(() => {
      this.clear();
      this.router.navigateByUrl('/login');
    });
    return observable;
  }

}