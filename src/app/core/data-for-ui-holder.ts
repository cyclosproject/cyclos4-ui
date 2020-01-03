import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Auth, DataForUi, RoleEnum, UiKind, User } from 'app/api/models';
import { AuthService, UiService } from 'app/api/services';
import { Configuration } from 'app/configuration';
import { ErrorStatus } from 'app/core/error-status';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { NextRequestState } from 'app/core/next-request-state';
import { I18n } from 'app/i18n/i18n';
import { isSameOrigin, setReloadButton, setRootAlert } from 'app/shared/helper';
import moment from 'moment-mini-ts';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { catchError, first, map, tap, switchMap } from 'rxjs/operators';
import { ContentService } from 'app/core/content.service';

/**
 * Injectable used to hold the `DataForUi` instance used by the application
 */
@Injectable({
  providedIn: 'root'
})
export class DataForUiHolder {

  private dataForUi$ = new BehaviorSubject<DataForUi>(null);
  private timeDiff: number;

  constructor(
    private apiConfiguration: ApiConfiguration,
    private i18nLoading: I18nLoadingService,
    private uiService: UiService,
    private authService: AuthService,
    private i18n: I18n,
    private injector: Injector,
    private nextRequestState: NextRequestState) {
  }

  /**
   * Returns a cold observer for initializing the `DataForUi` instance
   */
  initialize(): Observable<DataForUi> {
    const nextRequestState = this.nextRequestState;

    if (Configuration.redirectGuests && !nextRequestState.hasSession) {
      // Guests aren't handled at all in this frontend. Redirect them.
      location.assign(Configuration.redirectGuests);
      return of(null);
    }

    nextRequestState.ignoreNextError = true;
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
      switchMap(dataForUi => {
        this.dataForUi = dataForUi;
        if (dataForUi.auth == null || dataForUi.auth.user == null) {
          // When not logged-in, clear any previous cruft on the stored session token
          nextRequestState.setSessionToken(null);
        }

        // Prepare the content pages before initializing
        let contentPages = Configuration.contentPages ? Configuration.contentPages.contentPages(this.injector) : null;
        if (!contentPages) {
          contentPages = [];
        }
        if (contentPages instanceof Array) {
          // The pages are already available
          contentPages = of(contentPages);
        }

        // Actually get the content pages
        return contentPages.pipe(map(pages => {
          this.injector.get(ContentService).setContentPages(pages.filter(p => !!p), this.user);
          return dataForUi;
        }));
      }),
      catchError((resp: HttpErrorResponse) => {
        // Maybe we're using an old session data. In that case, we have to clear the session and try again
        if (nextRequestState.hasSession && [ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED].includes(resp.status)) {
          // Clear the session token and try again
          nextRequestState.setSessionToken(null);
          return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
            tap(dataForUi => {
              this.dataForUi = dataForUi;
            })
          );
        } else {
          // The server couldn't be contacted
          let serverOffline = this.i18n.error.serverOffline;
          let reloadPage = this.i18n.general.reloadPage;
          if (serverOffline.startsWith('???')) {
            // We're so early that we couldn't even fetch translations
            serverOffline = 'The server couldn\'t be contacted.<br>Please, try again later.';
            reloadPage = 'Reload';
          }
          setRootAlert(serverOffline);
          setReloadButton(reloadPage);
          return;
        }
      })
    );
  }

  /**
   * Returns a cold observer for reloading the `DataForUi` instance
   */
  reload(): Observable<DataForUi> {
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
      tap(dataForUi => {
        this.dataForUi = dataForUi;
      })
    );
  }

  get dataForUi(): DataForUi {
    return this.dataForUi$.value;
  }

  get auth(): Auth {
    return (this.dataForUi || {}).auth;
  }

  get user(): User {
    return (this.auth || {}).user;
  }

  get role(): RoleEnum {
    return (this.auth || {}).role;
  }

  /**
   * As the client clock may be wrong, we consider the server clock
   */
  now(): moment.Moment {
    const date = new Date();
    date.setTime(date.getTime() + this.timeDiff);
    return moment(date);
  }

  set dataForUi(dataForUi: DataForUi) {
    if (dataForUi != null) {
      this.dataForUi$.next(dataForUi);
      // Store the time diff
      this.timeDiff = new Date().getTime() - moment(dataForUi.currentClientTime).toDate().getTime();
      // Fetch the translations, if not statically set
      const language = (dataForUi.language || { code: 'en' }).code;
      const country = dataForUi.country;
      this.i18nLoading.load(language, country).pipe(first()).subscribe();
    }
  }

  /**
   * Adds a new observer subscription for DataForUi change events
   */
  subscribe(next?: (dataForUi: DataForUi) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.dataForUi$.subscribe(next, error, complete);
  }

  /**
   * Replaces the given session token with a new one.
   * Handles any exception and uses the session token as is,
   * because this operation is only supported in Cyclos 4.12 onwards.
   */
  replaceSession(sessionToken: string): Observable<void> {
    const nextRequestState = this.injector.get(NextRequestState);

    // Setup the basic authentication for the login request
    nextRequestState.nextAsGuest();
    nextRequestState.ignoreNextError = true;
    return this.authService.replaceSession({
      sessionToken: sessionToken,
      cookie: isSameOrigin(this.apiConfiguration.rootUrl)
    }).pipe(
      map(newSessionToken => {
        // Store the session token
        nextRequestState.setSessionToken(newSessionToken, isSameOrigin(this.apiConfiguration.rootUrl));
        return null;
      }),
      catchError((response: HttpErrorResponse) => {
        let actualSessionValue = null;
        if (response.status === ErrorStatus.NOT_FOUND) {
          // Not found means that the server is Cyclos 4.11, which doesn't implement replaceSession
          actualSessionValue = sessionToken;
        }
        nextRequestState.setSessionToken(actualSessionValue);
        return of(null);
      })
    );
  }

}
