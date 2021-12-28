import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { I18n } from 'app/i18n/i18n';
import { BehaviorSubject, EMPTY, Observable, Subscription } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

/**
 * Handles loading of translation keys
 */
@Injectable({
  providedIn: 'root',
})
export class I18nLoadingService {
  locales = I18n.locales();

  isStatic = false;
  i18nRoot: string;
  private locale$ = new BehaviorSubject<string>(null);

  constructor(
    private i18n: I18n,
    private http: HttpClient) {
  }

  /**
   * Called just after the application setup. Basically checks for a static locale
   */
  initialize(i18nRoot: string) {
    this.i18nRoot = i18nRoot;
    // If running in development mode, read the default translations first
    if (isDevMode()) {
      const hash = I18n.contentHash('en');
      return this.http.get(`${i18nRoot}/i18n.json?h=${hash}`).pipe(
        first(),
        tap({
          next: defaultValues => this.i18n.defaultValues = defaultValues
        }));
    } else {
      return EMPTY;
    }
  }

  /**
   * Loads the translation for the given language and country
   */
  load(language: string, country: string): Observable<I18n> {
    // Figure out the locale to use, according to the available ones
    let locale: string;
    const withCountry = `${language}_${country}`;
    if (this.locales.includes(withCountry)) {
      locale = withCountry;
    } else if (this.locales.includes(language)) {
      locale = language;
    } else {
      locale = 'en';
    }
    const url = `${this.i18nRoot}/i18n${locale === 'en' ? '' : '.' + locale}.json`;
    return this.http.get(url).pipe(
      map(values => {
        this.setLocale(locale, values);
        return this.i18n;
      }),
    );
  }

  /**
   * Adds a new observer subscription for locale change events.
   * The event is only triggered when the translations are fetched
   */
  subscribeForLocale(next?: (locale: string) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.locale$.subscribe(next, error, complete);
  }

  /**
   * Sets the locale and translation values.
   * Shouldn't be called by regular components, only by initializations.
   */
  private setLocale(locale: string, translationValues: any) {
    this.i18n.initialize(translationValues);
    if (this.locale$.value !== locale) {
      this.locale$.next(locale);
    }
    document.documentElement.lang = locale.toLowerCase();
  }
}
