import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { I18nMeta } from 'app/i18n/i18n-meta';
import { isDevServer } from 'app/shared/helper';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

/**
 * Handles loading of translation keys
 */
@Injectable({
  providedIn: 'root'
})
export class I18nLoadingService {
  locales = I18nMeta.locales();

  isStatic = false;
  i18nRoot: string;
  private resourceCacheKey: string;
  private locale$ = new BehaviorSubject<string>(null);

  constructor(@Inject(I18nInjectionToken) private i18n: I18n, private http: HttpClient) {}

  /**
   * Called just after the application setup. Basically checks for a static locale
   */
  initialize(i18nRoot: string, params: { resourceCacheKey?: string; locale?: string }) {
    this.i18nRoot = i18nRoot;
    this.resourceCacheKey = params.resourceCacheKey;
    // If running in development mode, read the default translations first
    if (isDevServer()) {
      const hash = I18nMeta.contentHash('en');
      return this.http.get(`${i18nRoot}/i18n.json?h=${hash}`).pipe(
        switchMap(defaultValues => {
          this.i18n.$defaults(defaultValues);
          return this.load(params.locale);
        })
      );
    } else {
      return this.load(params.locale);
    }
  }

  /**
   * Loads the translation for the given locale
   */
  private load(localeParam = 'en'): Observable<I18n> {
    // Figure out the locale to use, according to the available ones
    let locale: string;
    if (this.locales.includes(localeParam)) {
      locale = localeParam;
    } else {
      const parts = localeParam.split(/_/g);
      if (this.locales.includes(parts[0])) {
        locale = parts[0];
      } else {
        locale = 'en';
      }
    }

    const url = `${this.i18nRoot}/i18n${locale === 'en' ? '' : '.' + locale}.json?_k=${this.resourceCacheKey}`;
    return this.http.get(url).pipe(
      map(values => {
        this.setLocale(locale, values);
        return this.i18n;
      })
    );
  }

  /**
   * Adds a new observer subscription for locale change events.
   * The event is only triggered when the translations are fetched
   */
  subscribeForLocale(
    next?: (locale: string) => void,
    error?: (error: any) => void,
    complete?: () => void
  ): Subscription {
    return this.locale$.subscribe(next, error, complete);
  }

  /**
   * Sets the locale and translation values.
   * Shouldn't be called by regular components, only by initializations.
   */
  private setLocale(locale: string, translationValues: any) {
    this.i18n.$initialize(translationValues);
    if (this.locale$.value !== locale) {
      this.locale$.next(locale);
    }
    document.documentElement.lang = locale.toLowerCase();
  }
}
