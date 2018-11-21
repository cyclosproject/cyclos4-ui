import { Injectable } from '@angular/core';
import { DataForUi, UiKind } from 'app/api/models';
import { Subscription, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { NextRequestState } from 'app/core/next-request-state';
import { UIService } from 'app/api/services';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorStatus } from 'app/core/error-status';
import { tap, catchError } from 'rxjs/operators';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { defineLocale, LocaleData, getSetGlobalLocale } from 'ngx-bootstrap/chronos';
import * as moment from 'moment-mini-ts';


declare const setRootAlert: (boolean) => void;
declare const setReloadButton: (boolean) => void;

/**
 * Injectable used to hold the `DataForUi` instance used by the application
 */
@Injectable({
  providedIn: 'root'
})
export class DataForUiHolder {
  private dataForUi$ = new BehaviorSubject<DataForUi>(null);
  private timeDiff: number;
  localeData: LocaleData;

  constructor(
    private nextRequestState: NextRequestState,
    private uiService: UIService,
    private i18n: I18n) {
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
          setRootAlert(this.i18n(`The server couldn't be contacted.
          <br>Please, try again later.`));
          setReloadButton(this.i18n('Reload page'));
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
      this.localeData = this.createLocaleData(dataForUi);
      defineLocale('cyclos', this.localeData);
      getSetGlobalLocale('cyclos');
      this.dataForUi$.next(dataForUi);
      // Store the time diff
      this.timeDiff = new Date().getTime() - moment(dataForUi.currentClientTime).toDate().getTime();
    }
  }

  /**
   * Adds a new observer notified when the user logs-in (auth != null) or logs out (auth == null)
   */
  subscribe(next?: (dataForUi: DataForUi) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.dataForUi$.subscribe(next, error, complete);
  }

  private createLocaleData(dataForUi: DataForUi): LocaleData {
    const dateFormat = dataForUi.dateFormat.toUpperCase();
    let timeFormat = dataForUi.timeFormat;
    if (timeFormat.includes('a')) {
      // ngx-bootstrap datepicker expects hh as 12 hour, and the medidian must be uppercase
      timeFormat = timeFormat.replace(/H/g, 'h').replace('a', 'A');
    }

    return {
      abbr: 'cyclos',
      months: [
        this.i18n({ meaning: 'Long month', value: 'January' }),
        this.i18n({ meaning: 'Long month', value: 'February' }),
        this.i18n({ meaning: 'Long month', value: 'March' }),
        this.i18n({ meaning: 'Long month', value: 'April' }),
        this.i18n({ meaning: 'Long month', value: 'May' }),
        this.i18n({ meaning: 'Long month', value: 'June' }),
        this.i18n({ meaning: 'Long month', value: 'July' }),
        this.i18n({ meaning: 'Long month', value: 'August' }),
        this.i18n({ meaning: 'Long month', value: 'September' }),
        this.i18n({ meaning: 'Long month', value: 'October' }),
        this.i18n({ meaning: 'Long month', value: 'November' }),
        this.i18n({ meaning: 'Long month', value: 'December' })
      ],
      monthsShort: [
        this.i18n({ meaning: 'Short month', value: 'Jan' }),
        this.i18n({ meaning: 'Short month', value: 'Feb' }),
        this.i18n({ meaning: 'Short month', value: 'Mar' }),
        this.i18n({ meaning: 'Short month', value: 'Apr' }),
        this.i18n({ meaning: 'Short month', value: 'May' }),
        this.i18n({ meaning: 'Short month', value: 'Jun' }),
        this.i18n({ meaning: 'Short month', value: 'Jul' }),
        this.i18n({ meaning: 'Short month', value: 'Aug' }),
        this.i18n({ meaning: 'Short month', value: 'Sep' }),
        this.i18n({ meaning: 'Short month', value: 'Oct' }),
        this.i18n({ meaning: 'Short month', value: 'Nov' }),
        this.i18n({ meaning: 'Short month', value: 'Dec' })
      ],
      monthsParseExact: true,
      weekdays: [
        this.i18n({ meaning: 'Long weekday', value: 'Sunday' }),
        this.i18n({ meaning: 'Long weekday', value: 'Monday' }),
        this.i18n({ meaning: 'Long weekday', value: 'Tuesday' }),
        this.i18n({ meaning: 'Long weekday', value: 'Wednesday' }),
        this.i18n({ meaning: 'Long weekday', value: 'Thursday' }),
        this.i18n({ meaning: 'Long weekday', value: 'Friday' }),
        this.i18n({ meaning: 'Long weekday', value: 'Saturday' })
      ],
      weekdaysShort: [
        this.i18n({ meaning: 'Short weekday', value: 'Sun' }),
        this.i18n({ meaning: 'Short weekday', value: 'Mon' }),
        this.i18n({ meaning: 'Short weekday', value: 'Tue' }),
        this.i18n({ meaning: 'Short weekday', value: 'Wed' }),
        this.i18n({ meaning: 'Short weekday', value: 'Thu' }),
        this.i18n({ meaning: 'Short weekday', value: 'Fri' }),
        this.i18n({ meaning: 'Short weekday', value: 'Sat' })
      ],
      weekdaysMin: [
        'Su',
        'Mo',
        'Tu',
        'We',
        'Th',
        'Fr',
        'Sa'
      ],
      weekdaysParseExact: true,
      longDateFormat: {
        LT: timeFormat,
        LTS: timeFormat,
        L: dateFormat,
        LL: dateFormat,
        LLL: dateFormat,
        LLLL: dateFormat
      },
      calendar: {
        sameDay: '[Today at] LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L'
      },
      relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        ss: '%d seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
      },
      dayOfMonthOrdinalParse: /\d{1,2}/,
      ordinal: '%d',
      week: {
        dow: 1,
        doy: 4
      }
    };
  }
}
