import { Injectable } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Currency, DataForUi } from 'app/api/models';
import Big from 'big.js';
import { environment } from 'environments/environment';
import * as moment from 'moment-mini-ts';
import { DataForUiHolder } from './data-for-ui-holder';
import { I18n } from '@ngx-translate/i18n-polyfill';

export const ISO_DATE = 'YYYY-MM-DD';

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

  /** Uppercase date format. Example: `'DD/MM/YYYY'` */
  dateFormat: string;

  /** Separator for date fields. Example: `'/'` */
  dateSeparator: string;

  /** Date parts in the order they appear in the format. Example: `['MM', 'DD', 'YYYY']` */
  dateParts: string[];

  /** Date fields in the order they appear in the format. Example: `['date', 'month', 'year']` */
  dateFields: string[];

  /** Time format, such as `'hh:mm A'` or `'HH:mm'` */
  timeFormat: string;

  /** Separator used to group thousands. Example: `'.'` for `'999.999,99'` */
  groupingSeparator: string;

  /** Separator between whole / decimal parts. Example: `','` for `'999.999,99'` */
  decimalSeparator: string;

  private _dataForUi: DataForUi;

  /**
   * Sorts the given array according to the current date fields order.
   * The input must be in the ISO-8861 order (year, month, day).
   * So, for example, if the date patter is `'DD/MM/YYYY'`, the result will
   * be sorted as `[isoInput[2], isoInput[1], isoInput[0]]`
   */
  applyDateFields<T>(isoInput: T[]): T[] {
    if (isoInput == null || isoInput.length !== this.dateParts.length) {
      return isoInput;
    }
    return this.dateParts.map(f => {
      if (f.includes('D')) {
        return isoInput[2];
      } else if (f.includes('M')) {
        return isoInput[1];
      } else {
        return isoInput[0];
      }
    });
  }

  initialize(dataForUi: DataForUi): void {
    if (dataForUi == null) {
      return;
    }
    // Cyclos uses Java format, such as dd/MM/yyyy. Moment uses all uppercase for those.
    this.dateFormat = (dataForUi.dateFormat || ISO_DATE).toUpperCase();
    let arr = /(\w+)(.)(\w+)(.)(\w+)/.exec(this.dateFormat);
    if (arr == null || arr.input !== this.dateFormat) {
      // Invalid pattern. Assume the default.
      this.dateFormat = ISO_DATE;
      arr = /(\w+)(.)(\w+)(.)(\w+)/.exec(this.dateFormat);
    }
    // The array is: [matched_string, part0, sep, part1, sep, part2]
    this.dateSeparator = arr[2];
    this.dateParts = [arr[1], arr[3], arr[5]];
    this.dateFields = this.applyDateFields(['year', 'month', 'date']);

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
    const mm = this.parseAsMoment(value);
    if (mm === null) {
      // Empty input
      return null;
    }
    // Returns either the ISO-formatted date or undefined (if invalid)
    return mm.isValid() ? mm.format(ISO_DATE) : undefined;
  }

  /**
   * Parses the given date / string in the user locale as a Moment
   * @param value The moment, or undefined if null
   */
  parseAsMoment(value: Date | string): moment.Moment {
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'string' && value.length !== this.dateFormat.length) {
      return moment(undefined);
    }
    return moment(value, this.dateFormat);
  }

  /**
   * Formats the given date (or ISO-8601 string) as date according to the current settings
   * @param date The input date or string
   */
  formatAsDate(date: Date | string | moment.Moment): string {
    return this.doFormat(date, this.dateFormat);
  }

  /**
   * Formats the given date (or ISO-8601 string) as time according to the current settings
   * @param date The input date or string
   */
  formatAsTime(date: Date | string | moment.Moment): string {
    return this.doFormat(date, this.timeFormat);
  }

  /**
   * Formats the given date (or ISO-8601 string) as date / time according to the current settings
   * @param date The input date or string
   */
  formatAsDateTime(date: Date | string | moment.Moment): string {
    return this.doFormat(date, this.dateFormat + ' ' + this.timeFormat);
  }

  private doFormat(date: Date | string | moment.Moment, format: string): string {
    if (date == null) {
      return '';
    }
    if (date['format']) {
      // Already a moment
      return date['format'](format);
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
