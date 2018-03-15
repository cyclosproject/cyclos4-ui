import { Injectable } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';
import { NextRequestState } from './next-request-state';

/**
 * Service used to load the translation messages
 */
@Injectable()
export class TranslationLoaderService {

  loadedMessages: { [key: string]: any } = {};
  availableLocales: string[];
  staticTranslations: any;

  constructor(
    private nextRequestState: NextRequestState,
    private httpClient: HttpClient) {

    // Maybe the translations were statically compiled?
    const translations = environment.translations;
    if (translations) {
      this.staticTranslations = translations;
    }

    // Will have to load the messages file dynamically. Get the available locales.
    this.availableLocales = environment.locales as string[];
    if (this.availableLocales == null || this.availableLocales.length === 0) {
      this.availableLocales = ['en'];
    }
  }

  public load(lang: string, country: string = null): Promise<any> {
    if (this.staticTranslations != null) {
      // Statically compiled
      return Promise.resolve(this.staticTranslations);
    }

    // The candidate locales are from parameters
    const candidateLocales: string[] = [];
    candidateLocales.push(lang);
    candidateLocales.push(`${lang}_${country}`);

    // Resolve the actual locales to load (default is always attempted)
    const actualLocales: string[] = [];
    actualLocales.push(null);
    for (const locale of candidateLocales) {
      if (locale === 'en' || !this.availableLocales.includes(locale)) {
        continue;
      }
      actualLocales.push(locale);
    }

    // Load each translation
    const promises: Promise<any>[] = [];
    for (const locale of actualLocales) {
      promises.push(this.doLoad(locale));
    }
    return Promise.all(promises)
      .then(() => {
        return this.assembleFromLoaded(actualLocales);
      });
  }

  /**
   * Builds a messages object from the locales list, assuming it is ordered from more general to more specific
   * @param locales The locales to consider
   */
  private assembleFromLoaded(locales: string[]): any {
    // Build the resulting messages object
    const messages = {};
    // Scan the locales in reverse order (more specific to more general)
    for (let locale of locales.reverse()) {
      if (locale == null) {
        locale = 'en';
      }
      const locMessages = this.loadedMessages[locale];
      for (const key in locMessages || {}) {
        // If the message is still not present, copy it
        if (messages[key] === undefined) {
          messages[key] = locMessages[key];
        }
      }
    }
    return messages;
  }

  /**
   * Fetch the messages file for the given locale, or, if already loaded, resolve it directly
   * @param locale The locale to load
   */
  private doLoad(locale: string): Promise<any> {
    const key = locale || 'en';
    const loaded = this.loadedMessages[key];
    if (loaded) {
      // Already loaded
      return Promise.resolve(loaded);
    }
    // Perform the request
    this.nextRequestState.ignoreNextError = true;
    const suffix = locale == null ? '' : `_${locale}`;
    return this.httpClient.get(`translations/messages${suffix}.json`, {
      responseType: 'json'
    })
      .toPromise()
      .then(messages => {
        this.loadedMessages[key] = messages;
      })
      .catch(err => {
        // Silently ignore, resolving an emtpy object
        return {};
      });
  }
}
