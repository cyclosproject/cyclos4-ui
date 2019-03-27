import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { empty } from 'app/shared/helper';

const Channel = 'Channel';
const Authorization = 'Authorization';
const SessionToken = 'Session-Token';
const SessionPrefix = 'Session-Prefix';

/**
 * Stores data which will be set in the next API request
 */
@Injectable({
  providedIn: 'root'
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

  private pending$ = new BehaviorSubject<HttpRequest<any>[]>([]);
  private nextAuth: string;

  constructor() {
    this.requesting$ = this.pending$.asObservable().pipe(
      map(reqs => reqs.length > 0),
      distinctUntilChanged()
    );
  }

  /**
   * Applies the current authorization headers to the next request
   */
  apply(req: HttpRequest<any>): HttpRequest<any> {

    const headers = {};

    // This front-end is presented as main channel
    headers[Channel] = 'main';

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
    const result = req.clone({
      setHeaders: headers
    });

    // Append the resulting request in the pending list
    this.pending$.next([result, ...this.pending$.value]);

    // Just as a fallback, after 15 seconds, remove the request from the pending list
    setTimeout(() => {
      if (this.pending$.value.includes(result)) {
        this.pending$.next(this.pending$.value.filter(r => r !== result));
      }
    }, 15000);

    return result;
  }

  /**
   * Removes the given request from the pending list
   * @param req The request
   */
  finish(req: HttpRequest<any>) {
    this.pending$.next(this.pending$.value.filter(r => r !== req));
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
  setSessionToken(sessionToken: string, useCookie = false) {
    localStorage.removeItem(SessionToken);
    localStorage.removeItem(SessionPrefix);
    if (sessionToken) {
      localStorage.setItem(useCookie ? SessionPrefix : SessionToken, sessionToken);
    }
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


}
