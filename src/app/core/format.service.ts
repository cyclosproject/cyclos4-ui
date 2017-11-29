import { Injectable } from '@angular/core';
import { DataForUi, Currency, ThemeUIElement } from 'app/api/models';
import * as moment from 'moment';
import { ApiConfiguration } from 'app/api/api-configuration';

import { environment } from 'environments/environment';
import { GeneralMessages } from 'app/messages/general-messages';
import { MatDateFormats } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import Big from 'big.js';

/**
 * Names for week days or months, in several forms:
 * - long: Full name, such as 'December'
 * - short: 3-letter name, such as 'Dec'
 * - narrow: Single letter name, such as 'D'
 */
export type Names = {
  'long': string[],
  'short': string[],
  'narrow': string[]
};

/**
 * Holds a shared instance of DataForUi and knows how to format dates and numbers
 */
@Injectable()
export class FormatService {

  constructor(
    private apiConfiguration: ApiConfiguration,
    private generalMessages: GeneralMessages) {
  }

  dateFormat: string;
  timeFormat: string;
  groupingSeparator: string;
  decimalSeparator: string;
  dateParser: any;
  materialDateFormats = new BehaviorSubject<MatDateFormats>(null);

  private _dataForUi: DataForUi;
  private _monthNames: Names;
  private _dayNames: Names;

  get monthNames(): Names {
    if (this._monthNames == null) {
      this._monthNames = this.getNames(
        this.generalMessages.monthsLong(),
        this.generalMessages.monthsShort(),
        this.generalMessages.monthsNarrow());
    }
    return this._monthNames;
  }

  get dayNames(): Names {
    if (this._dayNames == null) {
      this._dayNames = this.getNames(
        this.generalMessages.daysLong(),
        this.generalMessages.daysShort(),
        this.generalMessages.daysNarrow());
    }
    return this._dayNames;
  }

  private getNames(long: string, short: string, narrow: string): Names {
    return {
      'long': long.split(','),
      'short': short.split(','),
      'narrow': narrow.split(',')
    };
  }

  initialize(dataForUi: DataForUi): void {
    this._dataForUi = (dataForUi || {});
    // Cyclos uses Java format, such as dd/MM/yyyy. Moment uses all uppercase for those.
    this.dateFormat = (this._dataForUi.dateFormat || 'YYYY-MM-DD').toUpperCase();

    // The time format is consistent, except that we want uppercase AM/PM markers.
    this.timeFormat = (this._dataForUi.timeFormat || 'HH:mm').replace('a', 'A');
    this.groupingSeparator = this._dataForUi.groupingSeparator || ',';
    this.decimalSeparator = this._dataForUi.decimalSeparator || '.';

    this.materialDateFormats.next({
      parse: {
        dateInput: this.dateFormat
      },
      display: {
        dateInput: this.dateFormat,
        monthYearLabel: this.monthYearLabel,
        dateA11yLabel: this.dateFormat,
        monthYearA11yLabel: this.monthYearLabel
      }
    });
  }

  private get monthYearLabel(): string {
    const match = /\w+(.).+/.exec(this.dateFormat);
    if (!match) {
      return this.dateFormat;
    }
    const sep = match[1];
    // Remove the day part
    let fmt = this.dateFormat.replace('DD', '').replace(sep + sep, sep);
    if (fmt.startsWith(sep)) {
      fmt = fmt.substr(1);
    }
    return fmt;
  }

  /**
   * Returns the application title
   */
  public get appTitle(): string {
    return environment.appTitle;
  }

  /**
   * Returns the application title used inside the menu on small devices
   */
  public get appTitleMenu(): string {
    return environment.appTitleMenu || this.appTitle;
  }

  /**
   * Returns the DataForUi instance
   */
  public get dataForUi(): DataForUi {
    return this._dataForUi;
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
   */
  numberToFixed(num: number | string, scale: number): string {
    if (num == null) {
      return null;
    }

    let bignum: any;
    try {
      bignum = Big(num);
    } catch (Error) {
      return null;
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
   */
  formatAsNumber(num: number | string, scale: number): string {
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
   */
  formatAsCurrency(currency: Currency, num: number | string): string {
    if (num == null || num === '') {
      return '';
    }
    currency = (currency || {});
    const decimals = currency.decimalDigits || 2;
    const prefix = currency.prefix || '';
    const suffix = currency.suffix || '';
    return prefix + this.formatAsNumber(num, decimals) + suffix;
  }

  /**
   * Parses the given text as string in the configuration-defined format,
   * returning an ISO formatted date.
   * If the input is null or empty, returns null.
   * If the input is an invalid date, returns 'invalid'.
   */
  parseDate(text: string): string {
    if (text == null || text === '') {
      return null;
    }
    if (text.length !== this.dateFormat.length) {
      return undefined;
    }
    const mm = moment(text, this.dateFormat);
    if (!mm.isValid()) {
      return undefined;
    }
    return mm.format('YYYY-MM-DD');
  }
}
