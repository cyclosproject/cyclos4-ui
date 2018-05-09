import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';

/**
 * Configuration for the performed HTTP requests
 */
@Injectable()
export class HttpRequestConfiguration {
  private nextAuthHeader: string;
  private nextAuthValue: string;

  /** Set to basic authentication */
  basic(user: string, password: string): void {
    this.nextAuthHeader = 'Authorization';
    this.nextAuthValue = 'Basic ' + btoa(user + ':' + password);
  }

  /** Set to session key */
  nextAsSession(sessionKey: string): void {
    this.nextAuthHeader = 'Session';
    this.nextAuthValue = sessionKey;
  }

  /** Clear any authentication headers (to be called after logout) */
  clear(): void {
    this.nextAuthHeader = null;
    this.nextAuthValue = null;
  }

  /** Apply the current authorization headers to the given request */
  apply(req: HttpRequest<any>): HttpRequest<any> {
    const headers = {};
    if (this.nextAuthHeader) {
      headers[this.nextAuthHeader] = this.nextAuthValue;
    }
    // Apply the headers to the request
    return req.clone({
      setHeaders: headers
    });
  }
}
