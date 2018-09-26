import { Injectable } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Currency, DataForUi } from 'app/api/models';
import Big from 'big.js';
import { environment } from 'environments/environment';
import * as moment from 'moment-mini-ts';
import { DataForUiHolder } from './data-for-ui-holder';
import { I18n } from '@ngx-translate/i18n-polyfill';

/**
 * Holds a shared instance of DataForUi and knows how to format dates and numbers
 */
@Injectable({
  providedIn: 'root'
})
export class FormatService {

  constructor(
    dataForUiHolder: DataForUiHolder,
    private apiConfiguration: ApiConfiguration,
    private i18n: I18n) {
    dataForUiHolder.subscribe(dataForUi => this.initialize(dataForUi));
    // If already loaded, initialize right away
    if (dataForUiHolder.dataForUi) {
      this.initialize(dataForUiHolder.dataForUi);
    }
  }

  dateFormat: string;
  timeFormat: string;
  groupingSeparator: string;
  decimalSeparator: string;

  private _dataForUi: DataForUi;

  initialize(dataForUi: DataForUi): void {
    if (dataForUi == null) {
      return;
    }
    // Cyclos uses Java format, such as dd/MM/yyyy. Moment uses all uppercase for those.
    this.dateFormat = (dataForUi.dateFormat || 'YYYY-MM-DD').toUpperCase();

    // The time format is consistent, except that we want uppercase AM/PM markers.
    this.timeFormat = (dataForUi.timeFormat || 'HH:mm').replace('a', 'A');
    this.groupingSeparator = dataForUi.groupingSeparator || ',';
    this.decimalSeparator = dataForUi.decimalSeparator || '.';

    this._dataForUi = dataForUi;
  }

  /**
   * Returns the application title
   */
  public get appTitle(): string {
    return environment.appTitle;
  }

  /**
   * Returns the application title for xs devices
   */
  public get appTitleSmall(): string {
    return environment.appTitleSmall || environment.appTitle;
  }

  /**
   * Returns the application title used inside the menu on small devices
   */
  public get appTitleMenu(): string {
    return environment.appTitleMenu || this.appTitle;
  }

  /**
   * Returns the full URL to the configuration image (logo) with the given id
   */
  getLogoUrl(id: string): string {
    return this.apiConfiguration.rootUrl
      + '/../content/images/currentConfiguration/'
      + id + '?' + this._dataForUi.resourceCacheKey;
  }

  /**
   * Parses a date, returning `null` if the input is empty, `undefined` if the date is invalid or else, the date.
   * @param date The native Date or string in the user format according to Cyclos settings
   * @returns An ISO-8601 date, or `undefined` if the input is invalid
   */
  parseAsDate(value: Date | string): string {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'string' && value.length !== this.dateFormat.length) {
      return undefined;
    }
    const mm = moment(value, this.dateFormat);
    if (!mm.isValid()) {
      return undefined;
    }
    return mm.format('YYYY-MM-DD');
  }

  /**
   * Formats the given date (or ISO-8601 string) as date according to the current settings
   * @param date The input date or string
   */
  formatAsDate(date: Date | string): string {
    return this.doFormat(date, this.dateFormat);
  }

  /**
   * Formats the given date (or ISO-8601 string) as time according to the current settings
   * @param date The input date or string
   */
  formatAsTime(date: Date | string): string {
    return this.doFormat(date, this.timeFormat);
  }

  /**
   * Formats the given date (or ISO-8601 string) as date / time according to the current settings
   * @param date The input date or string
   */
  formatAsDateTime(date: Date | string): string {
    return this.doFormat(date, this.dateFormat + ' ' + this.timeFormat);
  }

  private doFormat(date: Date | string, format: string): string {
    if (date == null) {
      return '';
    }
    return moment(date).parseZone().format(format);
  }

  /**
   * Returns a string representing a number with a fixed number of decimals
   * @param num The number (or string)
   * @param scale The number of decimal digits
   * @returns The string representing the number, or `undefined` if the input is invalid
   */
  numberToFixed(num: number | string, scale: number): string {
    if (num == null) {
      return null;
    }

    let bignum: any;
    try {
      bignum = Big(num);
    } catch (Error) {
      return undefined;
    }

    return bignum.toFixed(scale);
  }

  /**
   * Returns whether the given number (or string) represents a positive number
   * @param num The input number or string representation of a number
   */
  isPositive(num: number | string): boolean {
    if (num == null) {
      return false;
    }
    if (typeof (num) === 'number') {
      return num > 0;
    }
    return !num.startsWith('-');
  }

  /**
   * Returns whether the given number (or string) represents a negative number
   * @param num The input number or string representation of a number
   */
  isNegative(num: number | string): boolean {
    if (num == null) {
      return false;
    }
    if (typeof (num) === 'number') {
      return num < 0;
    }
    return num.startsWith('-');
  }

  /**
   * Returns whether the given number (or string) represents zero
   * @param num The input number or string representation of a number
   */
  isZero(num: number | string): boolean {
    if (num == null) {
      return false;
    }
    return this.numberToFixed(num, 6) === '0.000000';
  }

  /**
   * Formats the given number (or string) as number according to the current settings
   * @param num The input number or string representation of a number
   * @param scale The number of decimal digits
   * @param forceSign If true will output + for positive numbers
   */
  formatAsNumber(num: number | string, scale: number, forceSign: boolean = false): string {
    const fixed = this.numberToFixed(num, scale);
    if (fixed == null) {
      return '';
    }

    const parts = fixed.split('.');
    let intPart = parts[0];
    const decPart = parts.length === 1 ? null : parts[1];

    const wasNegative = intPart.startsWith('-');
    if (wasNegative) {
      intPart = intPart.substring(1);
    }

    const integers: string[] = [];
    while (intPart.length > 0) {
      let part: string;
      if (intPart.length < 3) {
        part = intPart;
        intPart = '';
      } else {
        part = intPart.substring(intPart.length - 3);
        intPart = intPart.substring(0, intPart.length - 3);
      }
      integers.splice(0, 0, part);
    }
    let intFmt = integers.join(this.groupingSeparator);
    if (wasNegative) {
      intFmt = '-' + intFmt;
    } else if (forceSign) {
      intFmt = '+' + intFmt;
    }
    if (decPart) {
      return intFmt + this.decimalSeparator + decPart;
    } else {
      return intFmt;
    }
  }

  /**
   * Formats a number as currency
   * @param currency The currency to format
   * @param num The number to format
   * @param forceSign If true will output + for positive numbers
   */
  formatAsCurrency(currency: Currency, num: number | string, forceSign: boolean = false): string {
    if (num == null || num === '') {
      return '';
    }
    currency = (currency || {});
    const decimals = currency.decimalDigits || 2;
    const prefix = currency.prefix || '';
    const suffix = currency.suffix || '';
    return prefix + this.formatAsNumber(num, decimals, forceSign) + suffix;
  }

  /**
   * Returns a human-friendly byte-size label
   * @param bytes The number of bytes
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return this.i18n('{{n}} bytes', {
        n: bytes
      });
    }
    bytes /= 1024;
    if (bytes < 1024) {
      return this.i18n('{{n}}KB', {
        n: this.formatAsNumber(bytes, 1)
      });
    }
    bytes /= 1024;
    return this.i18n('{{n}}MB', {
      n: this.formatAsNumber(bytes, 1)
    });
  }
}
