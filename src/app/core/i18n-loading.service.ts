import { Injectable, isDevMode } from '@angular/core';
import { I18n } from 'app/i18n/i18n';
import { CacheService } from 'app/core/cache.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Configuration } from 'app/configuration';

/**
 * Handles loading of translation keys
 */
@Injectable({
  providedIn: 'root'
})
export class I18nLoadingService {

  isStatic = false;
  private locale$ = new BehaviorSubject<string>(null);

  constructor(
    private i18n: I18n,
    private http: HttpClient,
    private cache: CacheService) {
  }

  /**
   * Called just after the application setup. Basically checks for a static locale
   */
  initialize() {
    if (Configuration.staticLocale && Configuration.staticTranslations) {
      this.isStatic = true;
      this.setLocale(Configuration.staticLocale, Configuration.staticTranslations);
    }
    // If running in development mode, run the default translations first
    if (isDevMode()) {
      const hash = I18n.contentHash('en');
      this.http.get(`i18n/i18n.json?h=${hash}`).subscribe(defaultValues => this.i18n.defaultValues = defaultValues);
    }
  }

  /**
   * Loads the translation for the given language and country
   */
  load(language: string, country: string): Observable<I18n> {
    if (this.isStatic) {
      // No-op when using a static locale
      return of(this.i18n);
    }

    // Figure out the locale to use, according to the available ones
    const locales = I18n.locales();
    let locale: string;
    const withCountry = `${language}_${country}`;
    if (locales.includes(withCountry)) {
      locale = withCountry;
    } else if (locales.includes(language)) {
      locale = language;
    } else {
      locale = 'en';
    }

    // Get the translations file name and content hash for the actual locale
    const fileName = I18n.fileName(locale);
    const hash = I18n.contentHash(locale);

    // Check the cached version
    const hashKey = `locale_hash_${locale}`;
    const lastHash = this.cache.current(hashKey);
    const valuesKey = `locale_${locale}`;
    if (lastHash === hash) {
      // The cached value is ok
      const cachedValue = this.cache.current(valuesKey);
      this.setLocale(locale, cachedValue);
      return of(this.i18n);
    } else {
      // We need to fetch the value
      this.i18n.initialized$.next(false);
      return this.http.get(`i18n/${fileName}?h=${hash}`).pipe(
        map(values => {
          this.cache.set(hashKey, hash);
          this.cache.set(valuesKey, values);
          this.setLocale(locale, values);
          return this.i18n;
        })
      );
    }
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
    this.locale$.next(locale);
    document.documentElement.lang = locale.toLowerCase();
  }
}

