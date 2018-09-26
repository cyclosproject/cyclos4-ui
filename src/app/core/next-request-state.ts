import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';

const CHANNEL = 'Channel';
const AUTHORIZATION = 'Authorization';
const SESSION_TOKEN = 'Session-Token';

/**
 * Stores data which will be set in the next API request
 */
@Injectable({
  providedIn: 'root'
})
export class NextRequestState {

  private nextAuth: string;
  ignoreNextError: boolean;

  /**
   * Applies the current authorization headers to the next request
   */
  apply(req: HttpRequest<any>): HttpRequest<any> {

    const headers = {};

    // This front-end is presented as main channel
    headers[CHANNEL] = 'main';

    // If the next request must be done as guest, don't modify the headers
    if (this.nextAuth !== 'GUEST') {
      // Set the user authentication, if any
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
    }
    // Clear the nextAuth flag, so the next request is normal
    this.nextAuth = null;

    // Apply the headers to the request
    return req.clone({
      setHeaders: headers
    });
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
