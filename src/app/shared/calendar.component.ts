import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Host,
  Input, OnInit, Optional, Output, SkipSelf
} from '@angular/core';
import { AbstractControl, ControlContainer, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { FormatService, ISO_DATE } from 'app/core/format.service';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { DateConstraint, dateConstraintAsMoment } from 'app/shared/date-constraint';
import { chunk, range } from 'lodash';
import * as moment from 'moment-mini-ts';
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

  get type(): CalendarType {
    return this.type$.value;
  }
  set type(type: CalendarType) {
    this.type$.next(type);
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

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public format: FormatService,
    private dataForUiHolder: DataForUiHolder,
    private changeDetector: ChangeDetectorRef
  ) {
    super(controlContainer);
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
  }
  selectYear(year: number) {
    this.year = year;
    this.type = 'month';
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

}
