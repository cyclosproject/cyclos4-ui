import { Inject, Injectable } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Address, AddressFieldEnum, Currency, DataForUi, TimeFieldEnum, TimeInterval, WeekDayEnum } from 'app/api/models';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { empty, urlJoin } from 'app/shared/helper';
import moment from 'moment-mini-ts';
import { DataForFrontendHolder } from './data-for-frontend-holder';

export const ISO_DATE = 'YYYY-MM-DD';

/**
 * Holds a shared instance of DataForFrontend and knows how to format dates and numbers
 */
@Injectable({
  providedIn: 'root',
})
export class FormatService {
  constructor(
    dataForFrontendHolder: DataForFrontendHolder,
    i18nLoading: I18nLoadingService,
    private apiConfiguration: ApiConfiguration,
    @Inject(I18nInjectionToken) private i18n: I18n) {
    dataForFrontendHolder.subscribe(dataForFrontend => this.initialize(dataForFrontend?.dataForUi));
    // If already loaded, initialize right away
    if (dataForFrontendHolder.dataForFrontend) {
      this.initialize(dataForFrontendHolder.dataForUi);
    }
    i18nLoading.subscribeForLocale(() => {
      this.initialize(dataForFrontendHolder.dataForUi);
    });
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

  /** Month names - long */
  longMonthNames: string[];

  /** Month names - short */
  shortMonthNames: string[];

  /** Weekday names - minimal */
  minWeekdayNames: string[];

  /** Time field in singular form, Eg. day */
  singularTimeFieldNames: Map<TimeFieldEnum, string>;

  /** Time field in plural form. Eg. days */
  pluralTimeFieldNames: Map<TimeFieldEnum, string>;

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

    this.longMonthNames = [
      this.i18n.general.month.long.jan,
      this.i18n.general.month.long.feb,
      this.i18n.general.month.long.mar,
      this.i18n.general.month.long.apr,
      this.i18n.general.month.long.may,
      this.i18n.general.month.long.jun,
      this.i18n.general.month.long.jul,
      this.i18n.general.month.long.aug,
      this.i18n.general.month.long.sep,
      this.i18n.general.month.long.oct,
      this.i18n.general.month.long.nov,
      this.i18n.general.month.long.dec,
    ];

    this.shortMonthNames = [
      this.i18n.general.month.short.jan,
      this.i18n.general.month.short.feb,
      this.i18n.general.month.short.mar,
      this.i18n.general.month.short.apr,
      this.i18n.general.month.short.may,
      this.i18n.general.month.short.jun,
      this.i18n.general.month.short.jul,
      this.i18n.general.month.short.aug,
      this.i18n.general.month.short.sep,
      this.i18n.general.month.short.oct,
      this.i18n.general.month.short.nov,
      this.i18n.general.month.short.dec,
    ];

    this.minWeekdayNames = [
      this.i18n.general.weekday.min.sun,
      this.i18n.general.weekday.min.mon,
      this.i18n.general.weekday.min.tue,
      this.i18n.general.weekday.min.wed,
      this.i18n.general.weekday.min.thu,
      this.i18n.general.weekday.min.fri,
      this.i18n.general.weekday.min.sat,
    ];

    this.singularTimeFieldNames = new Map();
    this.singularTimeFieldNames.set(TimeFieldEnum.DAYS, this.i18n.general.timeField.singular.day);
    this.singularTimeFieldNames.set(TimeFieldEnum.HOURS, this.i18n.general.timeField.singular.hour);
    this.singularTimeFieldNames.set(TimeFieldEnum.MINUTES, this.i18n.general.timeField.singular.minute);
    this.singularTimeFieldNames.set(TimeFieldEnum.SECONDS, this.i18n.general.timeField.singular.second);
    this.singularTimeFieldNames.set(TimeFieldEnum.MILLIS, this.i18n.general.timeField.singular.milli);
    this.singularTimeFieldNames.set(TimeFieldEnum.MONTHS, this.i18n.general.timeField.singular.month);
    this.singularTimeFieldNames.set(TimeFieldEnum.WEEKS, this.i18n.general.timeField.singular.week);
    this.singularTimeFieldNames.set(TimeFieldEnum.YEARS, this.i18n.general.timeField.singular.year);

    this.pluralTimeFieldNames = new Map();
    this.pluralTimeFieldNames.set(TimeFieldEnum.DAYS, this.i18n.general.timeField.plural.days);
    this.pluralTimeFieldNames.set(TimeFieldEnum.HOURS, this.i18n.general.timeField.plural.hours);
    this.pluralTimeFieldNames.set(TimeFieldEnum.MINUTES, this.i18n.general.timeField.plural.minutes);
    this.pluralTimeFieldNames.set(TimeFieldEnum.SECONDS, this.i18n.general.timeField.plural.seconds);
    this.pluralTimeFieldNames.set(TimeFieldEnum.MILLIS, this.i18n.general.timeField.plural.millis);
    this.pluralTimeFieldNames.set(TimeFieldEnum.MONTHS, this.i18n.general.timeField.plural.months);
    this.pluralTimeFieldNames.set(TimeFieldEnum.WEEKS, this.i18n.general.timeField.plural.weeks);
    this.pluralTimeFieldNames.set(TimeFieldEnum.YEARS, this.i18n.general.timeField.plural.years);

    this._dataForUi = dataForUi;
  }

  /**
   * Returns the full URL to the configuration image (logo) with the given id
   */
  getLogoUrl(id: string): string {
    return urlJoin(this.apiConfiguration.rootUrl, '..', 'content', 'images', 'currentConfiguration', id) + '?'
      + this._dataForUi.resourceCacheKey;
  }

  /**
   * Formats an address by displaying "address line 1, address line 2"
   * Otherwise displays the first address field set
   */
  formatAddress(value: Address): string {
    let result = '';
    if (!empty(value.addressLine1)) {
      result += value.addressLine1;
    }
    if (!empty(value.addressLine2)) {
      if (!empty(result)) {
        result += ', ';
      }
      result += value.addressLine2;
    }
    if (empty(result)) {
      [
        AddressFieldEnum.STREET,
        AddressFieldEnum.BUILDING_NUMBER,
        AddressFieldEnum.COMPLEMENT,
        AddressFieldEnum.NEIGHBORHOOD,
        AddressFieldEnum.CITY,
        AddressFieldEnum.PO_BOX,
        AddressFieldEnum.COUNTRY,
        AddressFieldEnum.REGION].forEach(field => {
          const fieldValue = value[field];
          if (!empty(fieldValue)) {
            if (!empty(result)) {
              result += ', ';
            }
            result += fieldValue;
          }
        });
    } else if (!empty(value.city)) {
      // Also add the city
      if (!empty(result)) {
        result += ', ';
      }
      result += value.city;
    }
    return result;
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
      return (date as moment.Moment).format(format);
    }
    return moment(date).parseZone().format(format);
  }

  /**
   * Returns a string representing a number with a fixed number of decimals
   * @param input The number (or string)
   * @param scale The number of decimal digits
   * @returns The string representing the number, or `undefined` if the input is invalid
   */
  numberToFixed(input: number | string, scale: number): string {
    if (input == null) {
      return null;
    }

    let num: number;
    try {
      num = Number(input);
    } catch (Error) {
      return undefined;
    }

    return num.toFixed(scale == null ? 0 : scale);
  }

  /**
   * Returns whether both numbers represent the same number, optionally with a given scale
   */
  sameNumbers(n1: number | string, n2: number | string, scale = 9): boolean {
    return n1 != null && n2 != null && (this.numberToFixed(n1, scale) === this.numberToFixed(n2, scale));
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
    return !num.startsWith('-') && !this.isZero(num);
  }

  /**
   * Returns the absolute numeric value as string, or null for null input
   * @param num The input number or string representation of a number
   */
  abs(num: number | string): string {
    if (num == null) {
      return null;
    }
    if (typeof (num) === 'number') {
      return Math.abs(num).toFixed();
    }
    return num.startsWith('-') ? num.substring(1) : num;
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
   * @param scale The number of decimal digits. When negative will just toString() the number
   * @param forceSign If true will output + for positive numbers
   */
  formatAsNumber(num: number | string, scale: number, forceSign: boolean = false): string {
    const fixed = scale < 0 ? String(num) : this.numberToFixed(num, scale);
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
    const decimals = currency.decimalDigits === 0 ? 0 : currency.decimalDigits || 2;
    const prefix = currency.prefix || '';
    const suffix = currency.suffix || '';
    return prefix + this.formatAsNumber(num, decimals, forceSign) + suffix;
  }

  /**
   * Returns a human-friendly byte-size label
   * @param bytes The number of bytes
   */
  formatFileSize(bytes: number): string {
    if (bytes == null) {
      return '';
    }
    if (bytes < 1024) {
      return this.i18n.general.fileSize.b(String(bytes));
    }
    bytes /= 1024;
    if (bytes < 1024) {
      return this.i18n.general.fileSize.k(this.formatAsNumber(bytes, 1));
    }
    bytes /= 1024;
    return this.i18n.general.fileSize.m(this.formatAsNumber(bytes, 1));
  }

  /**
   * Formats a range of values
   * @param range The range, with min and max values
   */
  formatRange(range: { min?: any, max?: any; }, currency?: Currency): string {
    if (range == null || range.min == null && range.max == null) {
      return '';
    }
    if (range.min != null && range.max != null) {
      return this.i18n.general.range.fromTo({
        min: currency ? this.formatAsCurrency(currency, range.min) : range.min,
        max: currency ? this.formatAsCurrency(currency, range.max) : range.max,
      });
    } else if (range.min != null) {
      return this.i18n.general.range.from(currency ? this.formatAsCurrency(currency, range.min) : range.min);
    } else if (range.max != null) {
      return this.i18n.general.range.to(currency ? this.formatAsCurrency(currency, range.max) : range.max);
    }
  }

  formatTimeInterval(timeInterval: TimeInterval) {
    const amount = timeInterval == null ? null : timeInterval.amount;
    const fieldValue = timeInterval == null ? null : timeInterval.field;
    if (amount == null || fieldValue == null) {
      return '';
    }
    const names = amount === 1 ? this.singularTimeFieldNames : this.pluralTimeFieldNames;
    const field = names.get(fieldValue).toLowerCase();
    return this.i18n.general.timeField.pattern({ amount, field });
  }

  /**
   * Formats a boolean value, returning a key for yes / no
   * @param value The boolean value
   */
  formatBoolean(value: any): string {
    if (empty(value)) {
      return '';
    }
    if (typeof value === 'string') {
      value = value === 'true';
    }
    return value ? this.i18n.general.yes : this.i18n.general.no;
  }

  /**
   * The long name of a given month
   * @param month The month number, from 0 to 11
   */
  longMonthName(month: number): string {
    return this.longMonthNames[month];
  }

  /**
   * The short name of a given month
   * @param month The month number, from 0 to 11
   */
  shortMonthName(month: number): string {
    return this.shortMonthNames[month];
  }

  /**
   * The minimum name of a given weekday
   * @param weekday The weekday number, from 0 to 6
   */
  minWeekdayName(weekday: number): string {
    return this.minWeekdayNames[weekday];
  }

  /**
   * Returns the formatted week days separated by comma
   */
  formatWeekDays(weekDays: WeekDayEnum[]) {
    if (!empty(weekDays)) {
      const days = weekDays.length;
      if (![0, 7].includes(days)) {
        // When there is a specified subset for redeeming, show the days
        return weekDays.map(d => this.weekDay(d)).join(', ');
      }
    }
    return null;
  }

  weekDay(day: WeekDayEnum): string {
    switch (day) {
      case WeekDayEnum.FRI:
        return this.i18n.general.weekday.long.fri;
      case WeekDayEnum.MON:
        return this.i18n.general.weekday.long.mon;
      case WeekDayEnum.SAT:
        return this.i18n.general.weekday.long.sat;
      case WeekDayEnum.SUN:
        return this.i18n.general.weekday.long.sun;
      case WeekDayEnum.THU:
        return this.i18n.general.weekday.long.thu;
      case WeekDayEnum.TUE:
        return this.i18n.general.weekday.long.tue;
      case WeekDayEnum.WED:
        return this.i18n.general.weekday.long.wed;
    }
  }
}
