import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Host,
  Input, OnInit, Optional, Output, SkipSelf, Injector
} from '@angular/core';
import { AbstractControl, ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';
import { ISO_DATE } from 'app/core/format.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { DateConstraint, dateConstraintAsMoment } from 'app/shared/date-constraint';
import { chunk, range } from 'lodash';
import moment, { Moment } from 'moment-mini-ts';
import { BehaviorSubject } from 'rxjs';

export type CalendarType = 'month' | 'year' | 'multiYear';
const YEARS_PER_ROW = 4;
const YEAR_ROWS = 6;
const YEARS_TO_SHOW = YEARS_PER_ROW * YEAR_ROWS;
const OTHER_YEARS = Math.floor(YEARS_TO_SHOW / 2);
const MONTHS_PER_ROW = 2;

/**
 * Renders a calendar, which is embedded in a date-field
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'calendar',
  templateUrl: 'calendar.component.html',
  styleUrls: ['calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: CalendarComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: CalendarComponent, multi: true }
  ]
})
export class CalendarComponent extends BaseControlComponent<string> implements OnInit {
  @Input() id: string;
  @Input() minDate: DateConstraint;
  @Input() maxDate: DateConstraint;

  @Output() select = new EventEmitter<moment.Moment>();

  min: moment.Moment;
  max: moment.Moment;
  previousDisabled = false;
  nextDisabled = false;

  yearsPerRow = YEARS_PER_ROW;
  yearsRow = new Array(YEARS_PER_ROW).fill(0);
  now: moment.Moment;
  weekdays: string[] = Array(7).fill(null);
  type$ = new BehaviorSubject<CalendarType>('month');
  month$ = new BehaviorSubject<number>(null);
  year$ = new BehaviorSubject<number>(null);
  days$ = new BehaviorSubject<number[][]>(null);
  minYear$ = new BehaviorSubject<number>(null);
  maxYear$ = new BehaviorSubject<number>(null);
  years$ = new BehaviorSubject<number[][]>(null);
  months: number[][];

  focusedYear: number;
  focusedMonth: number;
  focusedDate: moment.Moment;

  get type(): CalendarType {
    return this.type$.value;
  }
  set type(type: CalendarType) {
    const now = this.valueAsMoment || this.now;
    if (!this.focusedYear) {
      this.focusedYear = now.year();
    }
    if (!this.focusedMonth) {
      this.focusedMonth = now.month();
    }
    if (!this.focusedDate) {
      this.focusedDate = now;
    }
    this.type$.next(type);
    setTimeout(() => {
      switch (type) {
        case 'multiYear':
          this.focusYear(this.focusedYear);
          break;
        case 'year':
          this.focusMonth(this.focusedMonth);
          break;
        case 'month':
          this.focusDate(this.focusedDate);
          break;
      }
    }, 5);
  }
  get month(): number {
    return this.month$.value;
  }
  set month(month: number) {
    this.month$.next(month);
  }
  get year(): number {
    return this.year$.value;
  }
  set year(year: number) {
    this.year$.next(year);
  }
  get days(): number[][] {
    return this.days$.value;
  }
  set days(days: number[][]) {
    this.days$.next(days);
  }
  get minYear(): number {
    return this.minYear$.value;
  }
  set minYear(minYear: number) {
    this.minYear$.next(minYear);
  }
  get maxYear(): number {
    return this.maxYear$.value;
  }
  set maxYear(maxYear: number) {
    this.maxYear$.next(maxYear);
  }
  get years(): number[][] {
    return this.years$.value;
  }
  set years(years: number[][]) {
    this.years$.next(years);
  }

  constructor(injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private changeDetector: ChangeDetectorRef
  ) {
    super(injector, controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.prepare();
    let date = this.now.clone().startOf('week');
    for (let i = 0; i < 7; i++) {
      this.weekdays[i] = this.format.minWeekdayName(this.now.day());
      date = date.add(1, 'days');
    }
    this.months = chunk(range(0, 12), MONTHS_PER_ROW);
    this.addSub(this.type$.subscribe(t => this.onTypeChanged(t)));
  }

  onValueInitialized(value: string) {
    const val = value ? moment(value, ISO_DATE) : this.dataForUiHolder.now();
    this.month = val.month();
    this.year = val.year();
    this.updateDays();
  }

  get valueAsMoment(): moment.Moment {
    const value = this.value;
    return value ? moment(value, ISO_DATE) : null;
  }
  set valueAsMoment(value: moment.Moment) {
    this.value = value.format(ISO_DATE);
  }

  prepare() {
    this.now = this.dataForUiHolder.now();
    const selected = this.valueAsMoment || this.now;
    this.month = selected.month();
    this.year = selected.year();
    this.min = dateConstraintAsMoment(this.minDate, this.now);
    this.max = dateConstraintAsMoment(this.maxDate, this.now);
    this.changeDetector.detectChanges();
    this.focusedYear = selected.year();
    this.focusedMonth = selected.month();
    this.focusedDate = selected;

    const shortcuts = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'PageUp', 'PageDown', 'Home', 'End'
    ];
    this.addShortcut(shortcuts, event => {
      this.handleKey(event);
    });

    setTimeout(() => {
      this.focusYear(this.focusedYear);
      this.focusMonth(this.focusedMonth);
      this.focusDate(this.focusedDate);
    }, 5);
  }

  /**
   * Sets the focus to a specific date. Only works when `type` is `month`.
   */
  focusDate(date: Moment) {
    if (this.type !== 'month') {
      return;
    }
    if (date == null) {
      date = this.now;
    }
    const prevYear = this.year;
    const prevMonth = this.month;
    if (prevYear !== date.year() || prevMonth !== date.month()) {
      this.year = date.year();
      this.month = date.month();
      this.updateDays();
    }
    this.focusedDate = date;
    setTimeout(() => {
      const element = document.getElementById(this.id + '_day_' + date.date());
      if (element) {
        element.focus();
      }
    }, 5);
  }

  /**
   * Sets the focus to a specific month. Only works when `type` is `year`.
   */
  focusMonth(month: number) {
    if (this.type !== 'year') {
      return;
    }
    while (month < 0) {
      month += 12;
      this.year = this.focusedYear--;
    }
    while (month >= 12) {
      month -= 12;
      this.year = this.focusedYear++;
    }
    this.focusedMonth = month;
    setTimeout(() => {
      const element = document.getElementById(this.id + '_month_' + month);
      if (element) {
        element.focus();
      }
    }, 5);
  }

  /**
   * Sets the focus to a specific month. Only works when `type` is `multi-year`.
   */
  focusYear(year: number) {
    if (this.type !== 'multiYear') {
      return;
    }
    this.focusedYear = year;
    while (year > this.maxYear) {
      this.minYear += YEARS_TO_SHOW;
      this.maxYear += YEARS_TO_SHOW;
      this.updateYears();
    }
    while (year < this.minYear) {
      this.minYear -= YEARS_TO_SHOW;
      this.maxYear -= YEARS_TO_SHOW;
      this.updateYears();
    }
    setTimeout(() => {
      const element = document.getElementById(this.id + '_year_' + year);
      if (element) {
        element.focus();
      }
    }, 5);
  }

  previous() {
    this.add(-1);
  }

  next() {
    this.add(1);
  }
  selectDate(date: number) {
    const mm = moment({ year: this.year, month: this.month, date: date });
    this.value = mm.format(ISO_DATE);
    this.select.emit(mm);
  }
  selectMonth(month: number) {
    this.month = month;
    this.type = 'month';
    this.focusDate(moment({ year: this.year, month: month, date: 1 }));
  }
  selectYear(year: number) {
    this.year = year;
    this.type = 'month';
    this.focusDate(moment({ year: this.year, month: 0, date: 1 }));
  }

  isToday(date: number) {
    return this.now.year() === this.year
      && this.now.month() === this.month
      && this.now.date() === date;
  }
  isThisYear(year: number) {
    return this.now.year() === year;
  }
  isThisMonth(month: number) {
    return this.now.year() === this.year
      && this.now.month() === month;
  }

  isSelected(date: number) {
    const selected = this.valueAsMoment;
    if (selected) {
      return selected.year() === this.year
        && selected.month() === this.month
        && selected.date() === date;
    }
    return false;
  }

  private onTypeChanged(type: CalendarType): void {
    const value = this.valueAsMoment || this.now;
    switch (type) {
      case 'month':
        this.updateDays();
        break;
      case 'multiYear':
        this.minYear = value.year() - OTHER_YEARS;
        this.maxYear = value.year() + OTHER_YEARS - 1;
        this.updateYears();
        break;
    }
    this.updatePreviousNextDisabled(type);
  }

  private updateDays() {
    const days = [];
    const now = moment({ year: this.year, month: this.month, date: 1 });
    const startDay = now.clone().startOf('month').startOf('week');
    const endDay = now.clone().endOf('month').endOf('week');
    const date = startDay.clone().subtract(1, 'day');
    while (date.isBefore(endDay, 'day')) {
      days.push(
        Array(7).fill(0).map(() => {
          return date.add(1, 'day').month() === this.month ? date.date() : null;
        })
      );
    }
    this.days = days;
  }

  private updateYears() {
    this.years = chunk(range(this.minYear, this.maxYear + 1), YEARS_PER_ROW);
  }

  isSelectable(year: number, month?: number, date?: number) {
    if (this.min || this.max) {
      const ref = moment({ year: year, month: month || 0, date: date || 1 });
      if (this.min && ref.clone().startOf('day').isBefore(this.min.clone().startOf('day'))) {
        return false;
      }
      if (this.max && ref.clone().endOf('day').isAfter(this.max.clone().endOf('day'))) {
        return false;
      }
    }
    return true;
  }

  private add(toAdd: -1 | 1) {
    switch (this.type) {
      case 'month':
        let month = this.month + toAdd;
        if (month < 0) {
          month = 11;
          this.year--;
        } else if (month > 11) {
          month = 0;
          this.year++;
        }
        this.month = month;
        this.updateDays();
        break;
      case 'year':
        this.year += toAdd;
        break;
      case 'multiYear':
        this.minYear += toAdd * YEARS_TO_SHOW;
        this.maxYear += toAdd * YEARS_TO_SHOW;
        this.updateYears();
        break;
    }
    this.updatePreviousNextDisabled(this.type);
  }

  private updatePreviousNextDisabled(type: CalendarType) {
    let min: moment.Moment;
    let max: moment.Moment;
    switch (type) {
      case 'month':
        min = moment({ year: this.year, month: this.month, date: 1 });
        max = min.clone().endOf('month');
        break;
      case 'year':
        min = moment({ year: this.year, month: 0, date: 1 });
        max = moment({ year: this.year, month: 11, date: 31 });
        break;
      case 'multiYear':
        min = moment({ year: this.minYear, month: 0, date: 1 });
        max = moment({ year: this.maxYear, month: 11, date: 31 });
        break;
      default:
        return;
    }
    min.subtract(1, 'day');
    max.add(1, 'day');
    this.previousDisabled = this.min && this.min.isAfter(min);
    this.nextDisabled = this.max && this.max.isBefore(max);
  }

  validate(c: AbstractControl): ValidationErrors {
    const errors: ValidationErrors = {};
    const value = c.value;
    if (value === null || value === '') {
      // Don't validate empty values
      return null;
    } else if (value === undefined) {
      // The value is already pre-validated with error
      errors.date = true;
    } else {
      const mmnt = moment(value);
      if (!mmnt.isValid()) {
        errors.date = true;
      } else {
        const min = this.min;
        if (min != null && mmnt.isBefore(min)) {
          errors.minDate = {
            min: this.format.formatAsDate(min)
          };
        }
        const max = this.max;
        if (max != null && mmnt.isAfter(max)) {
          errors.maxDate = {
            max: this.format.formatAsDate(max)
          };
        }
      }
    }
    return Object.keys(errors).length === 0 ? null : errors;
  }

  private handleKey(event: KeyboardEvent) {
    switch (this.type) {
      case 'multiYear':
        this.handleKeyMultiYear(event);
        break;
      case 'year':
        this.handleKeyYear(event);
        break;
      case 'month':
        this.handleKeyMonth(event);
        break;
    }
  }

  private handleKeyMultiYear(event: KeyboardEvent) {
    let year = this.focusedYear;
    switch (event.key) {
      case 'ArrowUp':
        year -= 4;
        break;
      case 'ArrowDown':
        year += 4;
        break;
      case 'ArrowLeft':
        year--;
        break;
      case 'ArrowRight':
        year++;
        break;
      case 'PageUp':
        year -= YEARS_TO_SHOW;
        break;
      case 'PageDown':
        year += YEARS_TO_SHOW;
        break;
      case 'Home':
        year = this.minYear;
        break;
      case 'End':
        year = this.maxYear;
        break;
    }
    this.focusYear(year);
  }

  private handleKeyYear(event: KeyboardEvent) {
    let month = this.focusedMonth;
    switch (event.key) {
      case 'ArrowUp':
        month -= 2;
        break;
      case 'ArrowDown':
        month += 2;
        break;
      case 'ArrowLeft':
        month--;
        break;
      case 'ArrowRight':
        month++;
        break;
      case 'PageUp':
        month -= 12;
        break;
      case 'PageDown':
        month += 12;
        break;
      case 'Home':
        month = 0;
        break;
      case 'End':
        month = 11;
        break;
    }
    this.focusMonth(month);
  }

  private handleKeyMonth(event: KeyboardEvent) {
    const date = this.focusedDate.clone();
    switch (event.key) {
      case 'ArrowUp':
        date.subtract(1, 'weeks');
        break;
      case 'ArrowDown':
        date.add(1, 'weeks');
        break;
      case 'ArrowLeft':
        date.subtract(1, 'days');
        break;
      case 'ArrowRight':
        date.add(1, 'days');
        break;
      case 'PageUp':
        date.subtract(1, 'months');
        break;
      case 'PageDown':
        date.add(1, 'months');
        break;
      case 'Home':
        date.subtract(1, 'years');
        break;
      case 'End':
        date.add(1, 'years');
        break;
    }
    this.focusDate(date);
  }

}
