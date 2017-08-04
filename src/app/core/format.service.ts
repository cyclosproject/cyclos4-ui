import { Injectable } from '@angular/core';
import { DataForUi, Currency, ThemeUIElement } from 'app/api/models';
import * as moment from 'moment';
import { ApiConfiguration } from "app/api/api-configuration";

import { environment } from "environments/environment"

declare const Big: any;

/**
 * Holds a shared instance of DataForUi and knows how to format dates and numbers
 */
@Injectable()
export class FormatService {
  private _dataForUi: DataForUi;
  public dateFormat: string;
  public timeFormat: string;
  public groupingSeparator: string;
  public decimalSeparator: string;
  public dateParser: any;

  initialize(dataForUi: DataForUi): void {
    this._dataForUi = (dataForUi || {});
    // Cyclos uses Java format, such as dd/MM/yyyy. Moment uses all uppercase for those.
    this.dateFormat = (this._dataForUi.dateFormat || 'YYYY-MM-DD').toUpperCase();

    // The time format is consistent, except that we want uppercase AM/PM markers.
    this.timeFormat = (this._dataForUi.timeFormat || 'HH:mm').replace("a", "A");
    this.groupingSeparator = this.groupingSeparator || ',';
    this.decimalSeparator = this.groupingSeparator || '.';
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
    return ApiConfiguration.rootUrl + "/../content/images/currentConfiguration/" 
      + id + "?" + this._dataForUi.resourceCacheKey;
  }

  /**
   * Formats the given date (or ISO-8601 string) as date according to the current settings
   * @param date The input date or string
   */
  formatAsDate(date: Date | string): string {
    if (date == null) {
      return "";
    }
    return moment(date).format(this.dateFormat);
  }

  /**
   * Formats the given date (or ISO-8601 string) as time according to the current settings
   * @param date The input date or string
   */
  formatAsTime(date: Date | string): string {
    if (date == null) {
      return "";
    }
    return moment(date).format(this.timeFormat);
  }

  /**
   * Formats the given date (or ISO-8601 string) as date / time according to the current settings
   * @param date The input date or string
   */
  formatAsDateTime(date: Date | string): string {
    if (date == null) {
      return "";
    }
    return moment(date).format(this.dateFormat + " " + this.timeFormat);
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

    var bignum: any;
    try {
      bignum = Big(num);
    } catch (Error) {
      return null;
    }

    return bignum.toFixed(scale);
  }

  /**
   * Returns whether the given numner (or string) represents a positive number
   * @param num The input number or string representation of a number
   */
  positive(num: number | string): boolean {
    if (num == null) {
      return false;
    }
    if (typeof(num) == 'number') {
      return num > 0;
    }
    return !num.startsWith('-');
  }

  /**
   * Returns whether the given numner (or string) represents a negative number
   * @param num The input number or string representation of a number
   */
  negative(num: number | string): boolean {
    if (num == null) {
      return false;
    }
    if (typeof(num) == 'number') {
      return num < 0;
    }
    return num.startsWith('-');
  }

  /**
   * Formats the given number (or string) as number according to the current settings
   * @param num The input number or string representation of a number
   * @param scale The number of decimal digits
   */
  formatAsNumber(num: number | string, scale: number): string {
    let fixed = this.numberToFixed(num, scale);
    if (fixed == null) {
      return '';
    }

    let parts = fixed.split('.');
    let intPart = parts[0];
    let decPart = parts.length == 1 ? null : parts[1];

    let wasNegative = intPart.startsWith('-');
    if (wasNegative) {
      intPart = intPart.substring(1);
    }

    var integers: string[] = [];
    while (intPart.length > 0) {
      let part: string;
      if (intPart.length < 3) {
        part = intPart;
        intPart = "";
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
    currency = (currency || {})
    let decimals = currency.decimalDigits || 2;
    let prefix = currency.prefix || "";
    let suffix = currency.suffix || "";
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
    if (text.length != this.dateFormat.length) {
      return undefined;
    }
    let mm = moment(text, this.dateFormat);
    if (!mm.isValid()) {
      return undefined;
    }
    return mm.format('YYYY-MM-DD');
  }
}