import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { AuthService } from 'app/api/services/auth.service';
import { empty } from 'app/shared/helper';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';

export const Channel = 'Channel';
export const Authorization = 'Authorization';
export const SessionToken = 'Session-Token';
export const SessionPrefix = 'Session-Prefix';
export const PreferredLocale = 'Preferred-Locale';

/**
 * Stores data which will be set in the next API request
 */
@Injectable({
  providedIn: 'root',
})
export class NextRequestState {

  /**
   * Observable indicating if a request is currently being performed
   */
  requesting$: Observable<boolean>;

  /**
   * Flag to disable default error handling on next request
   */
  ignoreNextError: boolean;

  /**
   * Flag to not close notification on next request
   */
  leaveNotification: boolean;

  /**
   * Additional query parameters to send on the next request
   */
  queryParams: Params;

  /**
   * Whether to split the session token on authentication
   */
  useCookie: boolean;

  private pending$ = new BehaviorSubject<HttpRequest<any>[]>([]);
  private nextAuth: string;

  constructor(
    private authService: AuthService) {
    this.requesting$ = this.pending$.asObservable().pipe(
      map(reqs => reqs.length > 0),
      distinctUntilChanged(),
    );
  }

  /**
   * Applies the current authorization headers to the next request
   */
  apply(req: HttpRequest<any>): HttpRequest<any> {

    const headers = {};

    // This front-end is presented as main channel
    headers[Channel] = 'main';

    // Pass in the preferred locale
    const locale = localStorage.getItem(PreferredLocale);
    if (!empty(locale)) {
      headers[PreferredLocale] = locale;
    }

    // If the next request must be done as guest, don't modify the headers
    if (this.nextAuth !== 'GUEST') {
      // Set the user authentication, if any
      if (this.nextAuth) {
        // Send the request as basic auth
        headers[Authorization] = this.nextAuth;
        // Prevent subsequent requests from using this auth again
        this.nextAuth = null;
      } else {
        // Send the session headers
        const toApply = this.headers;
        for (const key of Object.keys(toApply)) {
          headers[key] = toApply[key];
        }
      }
    }
    // Clear the nextAuth flag, so the next request is normal
    this.nextAuth = null;

    // Apply the headers to the request
    let result = req.clone({
      setHeaders: headers,
    });

    // When there are additional parameters to append, do it
    if (this.queryParams) {
      let httpParams = result.params;
      for (const key of Object.keys(this.queryParams)) {
        httpParams = httpParams.append(key, this.queryParams[key]);
      }
      result = result.clone({
        params: httpParams,
      });
      this.queryParams = null;
    }

    // Append the resulting request in the pending list
    if (this.trackRequest(result)) {
      this.pending$.next([result, ...this.pending$.value]);
    }

    return result;
  }

  /**
   * As a workaround to the issue https://github.com/angular/angular/issues/22324,
   * we skip the fields validation request, which is used as async validation, and is
   * likely to trigger the bug
   */
  trackRequest(request: HttpRequest<any>): boolean {
    return !request.url.includes('/users/validate/');
  }

  /**
   * Removes the given request from the pending list
   * @param req The request
   */
  finish(req: HttpRequest<any>) {
    if (this.trackRequest(req)) {
      this.pending$.next(this.pending$.value.filter(r => r !== req));
    }
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
   * Sets the next request to be performed as guest
   */
  nextAsGuest(): void {
    this.nextAuth = 'GUEST';
  }

  /**
   * Sets the value of the session token
   */
  setSessionToken(sessionToken: string) {
    localStorage.removeItem(SessionToken);
    localStorage.removeItem(SessionPrefix);
    if (sessionToken) {
      localStorage.setItem(this.useCookie ? SessionPrefix : SessionToken, sessionToken);
    }
  }

  /**
   * Replaces a session token token obtained externally by a new one, correctly setting the cookie if needed.
   * Returns a cold observer.
   */
  replaceSession(sessionToken: string): Observable<any> {
    this.nextAsGuest();
    return this.authService.replaceSession({
      sessionToken,
      cookie: this.useCookie,
    }).pipe(switchMap(newToken => {
      this.setSessionToken(newToken);
      return of(null);
    }));
  }

  /**
   * Returns whether a session is used
   */
  get hasSession(): boolean {
    return !empty(localStorage.getItem(SessionToken))
      || !empty(localStorage.getItem(SessionPrefix));
  }

  /**
   * Appends the session token to the given URL
   * @param url The base URL
   * @param nextRequestState The next request state
   */
  appendAuth(url: string): string {
    const sep = url.includes('?') ? '&' : '?';
    const token = localStorage.getItem(SessionToken);
    if (!empty(token)) {
      return `${url}${sep}${SessionToken}=${encodeURIComponent(token)}`;
    }
    const prefix = localStorage.getItem(SessionPrefix);
    if (!empty(prefix)) {
      return `${url}${sep}${SessionPrefix}=${encodeURIComponent(prefix)}`;
    }
    return url;
  }

  /**
   * Indicates that there will be an external redirect.
   * Will cause the `requesting$` `Observable` to emit `true`.
   */
  willExternalRedirect() {
    this.pending$.next([null]);
  }

  /**
   * Returns headers for requests using the current session
   */
  get headers(): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    const token = localStorage.getItem(SessionToken);
    if (!empty(token)) {
      result[SessionToken] = token;
    }
    const prefix = localStorage.getItem(SessionPrefix);
    if (!empty(prefix)) {
      result[SessionPrefix] = prefix;
    }
    return result;
  }

  /**
   * Clears the pending request queue
   */
  clearRequests() {
    this.pending$.next([]);
  }

}
