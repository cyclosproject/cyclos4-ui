import { Injectable } from '@angular/core';
import { OidcAuthorizeResult } from 'app/consent/models/oidc-authorize-result';
import { OidcDataForConsent } from 'app/consent/models/oidc-data-for-consent';
import { OidcService } from 'app/consent/oidc.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { empty } from 'app/shared/helper';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// In production the data is pre-rendered in the host page
declare const data: OidcDataForConsent;

/**
 * Holds the OidcDataForConsent instance and manages its state
 */
@Injectable()
export class ConsentState {
  data$ = new BehaviorSubject<OidcDataForConsent>(null);
  processing$ = new BehaviorSubject(false);
  redirecting$ = new BehaviorSubject(false);

  private locator: string;

  constructor(private oidcService: OidcService, private errorHandler: ErrorHandlerService) {}

  /**
   * Initializes the data
   */
  initialize(locator: string): Observable<OidcDataForConsent> {
    this.locator = locator;
    if (data) {
      this.data$.next(data);
      return of(data);
    } else {
      // We're on development. Fetch the data.
      return this.oidcService.getData(locator).pipe(
        tap(
          d => this.data$.next(d),
          err => this.errorHandler.handleHttpError(err)
        )
      );
    }
  }

  get data(): OidcDataForConsent {
    return this.data$.value;
  }

  /**
   * Authorize an OIDC request for the given user / password
   */
  authorize(user: string, password: string) {
    if (this.processing$.value || empty(user) || empty(password)) {
      return;
    }
    this.processing$.next(true);
    this.oidcService.approve(this.locator, user, password).subscribe(
      res => {
        this.processing$.next(false);
        this.redirect(res);
      },
      e => {
        this.processing$.next(false);
        this.errorHandler.handleHttpError(e);
      }
    );
  }

  /**
   * Deny the current OIDC request
   */
  deny() {
    if (this.processing$.value) {
      return;
    }
    this.processing$.next(true);
    this.oidcService.deny(this.locator).subscribe(
      res => {
        this.processing$.next(false);
        this.redirect(res);
      },
      e => {
        this.processing$.next(false);
        this.errorHandler.handleHttpError(e);
      }
    );
  }

  private redirect(resp: OidcAuthorizeResult) {
    this.redirecting$.next(true);
    if (resp.postData) {
      // A form-post
      const frm = document.createElement('form');
      frm.action = resp.url;
      frm.method = 'POST';
      frm.enctype = 'multipart/form-data';
      for (const key of Object.keys(resp.postData)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = resp.postData[key];
        frm.appendChild(input);
      }
      document.body.appendChild(frm);
      frm.submit();
    } else {
      // A redirect
      window.location.assign(resp.url);
    }
  }
}
