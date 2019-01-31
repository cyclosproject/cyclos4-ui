import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataForUi, UiKind } from 'app/api/models';
import { UIService } from 'app/api/services';
import { ErrorStatus } from 'app/core/error-status';
import { NextRequestState } from 'app/core/next-request-state';
import { Messages } from 'app/messages/messages';
import { setReloadButton, setRootAlert } from 'app/shared/helper';
import moment from 'moment-mini-ts';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Injectable used to hold the `DataForUi` instance used by the application
 */
@Injectable({
  providedIn: 'root'
})
export class DataForUiHolder {
  _staticLocale: string;
  get staticLocale(): string {
    return this._staticLocale;
  }
  set staticLocale(locale: string) {
    this._staticLocale = locale;
    this.locale$.next(locale);
  }

  private dataForUi$ = new BehaviorSubject<DataForUi>(null);
  private locale$ = new BehaviorSubject<string>(null);
  private timeDiff: number;
  private cachedTranslations = new Map<string, any>();

  constructor(
    private nextRequestState: NextRequestState,
    private uiService: UIService,
    private messages: Messages,
    private http: HttpClient) {
  }

  /**
   * Returns a cold observer for initializing the `DataForUi` instance
   */
  initialize(): Observable<DataForUi> {
    this.nextRequestState.ignoreNextError = true;
    return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
      tap(dataForUi => {
        this.dataForUi = dataForUi;
      }),
      catchError((resp: HttpErrorResponse) => {
        if (resp.status === 0) {
          // The server couldn't be contacted
          setRootAlert(this.messages.error.serverOffline);
          setReloadButton(this.messages.general.reloadPage);
          return;
        }
        // Maybe we're using an old session data. In that case, we have to clear the session and try again
        if (this.nextRequestState.sessionToken && [ErrorStatus.FORBIDDEN, ErrorStatus.UNAUTHORIZED].includes(resp.status)) {
          // Clear the session token and try again
          this.nextRequestState.sessionToken = null;
          return this.uiService.dataForUi({ kind: UiKind.CUSTOM }).pipe(
            tap(dataForUi => {
              this.dataForUi = dataForUi;
            })
          );
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
      if (this._staticLocale == null) {
        this.setTranslation((dataForUi.language || { code: 'en' }).code, dataForUi.country);
      }
    }
  }

  /**
   * Adds a new observer subscription for DataForUi change events
   */
  subscribe(next?: (dataForUi: DataForUi) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.dataForUi$.subscribe(next, error, complete);
  }

  /**
   * Adds a new observer subscription for locale change events.
   * The event is only triggered when the translations are fetched
   */
  subscribeForLocale(next?: (locale: string) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.locale$.subscribe(next, error, complete);
  }

  private setTranslation(language: string, country: string) {
    const locales = Messages.locales();
    let locale: string;
    const withCountry = `${language}_${country}`;
    if (locales.includes(withCountry)) {
      locale = withCountry;
    } else if (locales.includes(language)) {
      locale = language;
    } else {
      locale = 'en';
    }
    const fileName = Messages.fileName(locale);
    if (this.cachedTranslations.has(fileName)) {
      this._setLocale(locale, this.cachedTranslations.get(fileName));
    } else {
      // Load the translation
      this.messages.initialized$.next(false);
      this.http.get(`locale/${fileName}`).subscribe(values => {
        this.cachedTranslations.set(fileName, values);
        this._setLocale(locale, values);
      });
    }
  }

  /**
   * Sets the locale and translation values.
   * Shouldn't be called by regular components, only by initializations.
   */
  _setLocale(locale: string, translationValues: any) {
    this.messages.initialize(translationValues);
    this.locale$.next(locale);
    document.documentElement.lang = locale.toLowerCase();
  }

}
