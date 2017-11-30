import { Injectable, Injector } from '@angular/core';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { NotificationService } from 'app/core/notification.service';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators/tap';

const CHANNEL = 'Channel';
const AUTHORIZATION = 'Authorization';
const SESSION_TOKEN = 'Session-Token';

/**
 * Intercepts requests to set the correct headers and handle errors
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  // Must use the injector to prevent cyclic dependencies
  constructor(private injector: Injector) { }

  private nextAuth: string;
  private _ignoreNextError: boolean;

  /**
   * Sets the next request to ignore any errors
   */
  ignoreNextError() {
    this._ignoreNextError = true;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api/')) {
      // This is not a request to the API! proceed as is
      return next.handle(req);
    }

    // Maybe we should ignore errors...
    const ignoreError = this._ignoreNextError;
    this._ignoreNextError = false;

    // Close any notification before sending a request
    this.injector.get(NotificationService).close();

    const headers = {};

    // This front-end is presented as main channel
    headers[CHANNEL] = 'main';

    // Send the session token if any
    if (this.nextAuth) {
      // Send the request as basic auth
      headers[AUTHORIZATION] = this.nextAuth;
      // Prevent subsequent requests from using this auth again
      this.nextAuth = null;
    } else {
      // Send the session token if any
      const sessionToken = localStorage.getItem(SESSION_TOKEN);
      if (sessionToken) {
        headers[SESSION_TOKEN] = sessionToken;
      }
    }

    // Apply the headers to the request
    req = req.clone({
      setHeaders: headers
    });

    // Also handle errors globally
    return next.handle(req).pipe(
      tap(x => x, err => {
        if (!ignoreError) {
          this.injector.get(ErrorHandlerService).handleHttpError(err);
        }
      })
    );
  }

  /**
   * Sets the next request to use a basic authentication.
   * Useful only for the request that performs the login.
   * @param principal The user principal
   * @param password The user password
   */
  nextAsBasic(principal: string, password: string): void {
    this.nextAuth = 'Basic ' + btoa(principal + ':' + password);
  }

  /**
   * Sets the value of the session token
   */
  set sessionToken(sessionToken: string) {
    if (sessionToken) {
      localStorage.setItem(SESSION_TOKEN, sessionToken);
    } else {
      localStorage.removeItem(SESSION_TOKEN);
    }
  }

  /**
   * Returns the value of the session prefix
   */
  get sessionToken(): string {
    return localStorage.getItem(SESSION_TOKEN);
  }
}
