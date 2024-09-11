import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OidcAuthorizeResult } from 'app/consent/models/oidc-authorize-result';
import { OidcDataForConsent } from 'app/consent/models/oidc-data-for-consent';
import { Observable } from 'rxjs';

/**
 * Injectable service which communicates with the server
 */
@Injectable()
export class OidcService {
  public rootUrl: string;

  constructor(private http: HttpClient) {}

  getData(locator: string): Observable<OidcDataForConsent> {
    return this.http.get(`${this.rootUrl}/data/${locator}`);
  }

  approve(locator: string, user: string, password: string): Observable<OidcAuthorizeResult> {
    const body = new HttpParams().set('user', encodeURIComponent(user)).set('password', encodeURIComponent(password));
    return this.http.post<OidcAuthorizeResult>(`${this.rootUrl}/approve/${locator}/`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  deny(locator: string): Observable<OidcAuthorizeResult> {
    return this.http.post<OidcAuthorizeResult>(`${this.rootUrl}/deny/${locator}/`, null);
  }
}
