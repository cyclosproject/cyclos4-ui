import { Injectable } from '@angular/core';
import { Auth, User } from 'app/api/models';
import { AuthService } from 'app/api/services/auth.service';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { ApiHelper } from 'app/shared/api-helper';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators/tap';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Service used to manage the login status
 */
@Injectable()
export class LoginService {
  private _auth = new BehaviorSubject(null as Auth);
  private _loggingOut = new BehaviorSubject(false);

  public redirectUrl: string;

  private _authInitialized = false;


  constructor(
    private apiInterceptor: ApiInterceptor,
    private authService: AuthService,
    private router: Router) {
  }

  /**
   * Adds a new observer notified when the user logs-in (auth != null) or logs out (auth == null)
   */
  subscribeForAuth(next?: (value: Auth) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this._auth.subscribe(next, error, complete);
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
    return this._auth.value;
  }

  /**
   * Sets the current authentication
   */
  set auth(auth: Auth) {
    this._authInitialized = true;
    this._auth.next(auth);
  }

  /**
   * Returns whether the authorization has already been initialized
   */
  get authInitialized(): boolean {
    return this._authInitialized;
  }

  /**
   * Returns whether the service is in the process of logging out
   */
  get loggingOut(): boolean {
    return this._loggingOut.value;
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
  logout(): void {
    this.redirectUrl = null;
    if (this._auth == null) {
      // No one logged in
      return;
    }
    this._loggingOut.next(true);
    this.authService.logout()
      .subscribe(() => {
        this.router.navigateByUrl('/login');
        this.clear();
        setTimeout(() => this._loggingOut.next(false), 100);
      });
  }
}
