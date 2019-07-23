import {
  ChangeDetectionStrategy, Component, ElementRef, Host, Injector,
  Input, OnInit, Optional, QueryList, SkipSelf, ViewChild, ViewChildren
} from '@angular/core';
import {
  AbstractControl, ControlContainer, FormArray, FormBuilder,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator
} from '@angular/forms';
import { CustomFieldSizeEnum } from 'app/api/models';
import { ISO_DATE } from 'app/core/format.service';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { CalendarComponent } from 'app/shared/calendar.component';
import { DateConstraint, dateConstraintAsMoment } from 'app/shared/date-constraint';
import { empty } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { range } from 'lodash';
import moment, { Moment } from 'moment-mini-ts';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';

/**
 * Input used to edit a single date
 */
@Component({
  selector: 'date-field',
  templateUrl: 'date-field.component.html',
  styleUrls: ['date-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: DateFieldComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: DateFieldComponent, multi: true }
  ]
})
export class DateFieldComponent
  extends BaseFormFieldComponent<string> implements Validator, OnInit {

  @Input() minDate: DateConstraint = 'any';
  @Input() maxDate: DateConstraint = 'any';

  min: moment.Moment;
  max: moment.Moment;

  partControls: FormArray;
  options: string[][];
  optionLabels: string[][];
  fieldNames: string[];
  fieldInitials: string[];

  @ViewChildren('part') parts: QueryList<ElementRef>;
  @ViewChild('toggleButton', { static: false }) toggleRef: ElementRef;
  @ViewChild('dropdown', { static: false }) dropdown: BsDropdownDirective;
  @ViewChildren(CalendarComponent) calendar: QueryList<CalendarComponent>;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    formBuilder: FormBuilder,
    public layout: LayoutService) {
    super(injector, controlContainer);
    this.partControls = formBuilder.array(new Array(this.format.dateFields.length).fill(''));
    this.addSub(this.partControls.valueChanges.subscribe(parts => this.setFromParts(parts)));
  }

  /**
   * Sets the internal value from the given part values
   */
  setFromParts(parts: any[]) {
    if (parts != null) {
      const hasEmpty = parts.findIndex(empty) >= 0;
      const hasNotEmpty = parts.findIndex(p => !empty(p)) >= 0;
      if (!hasNotEmpty) {
        // All parts are empty - set the value to null
        parts = null;
      } else if (hasEmpty) {
        const now = this.dataForUiHolder.now();
        const defaults = this.format.applyDateFields([now.year(), now.month() + 1, now.date()].map(String));
        parts = parts.map((p, i) => p || defaults[i]);
      }
    }
    if (parts == null) {
      this.setValue(null, true);
    } else {
      const value: { year?: number, month?: number, date?: number } = {};
      for (let i = 0; i < parts.length; i++) {
        value[this.format.dateFields[i]] = parseInt(parts[i], 10);
      }
      value.month--;
      const mmnt = moment(value);
      this.value = mmnt.isValid() ? mmnt.format(ISO_DATE) : undefined;
    }
  }

  setFromDate(date: Date) {
    this.value = this.format.parseAsDate(date);
  }

  get valueAsMoment(): Moment {
    const value = this.value;
    if (empty(value)) {
      return null;
    } else {
      return moment(value);
    }
  }

  set valueAsMoment(value: Moment) {
    if (value == null) {
      this.setValue(null);
    } else {
      this.setValue(value.format(ISO_DATE));
    }
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.fieldSize == null) {
      this.fieldSize = CustomFieldSizeEnum.MEDIUM;
    }
    this.fieldNames = this.format.applyDateFields([
      this.i18n.general.datePart.long.year,
      this.i18n.general.datePart.long.month,
      this.i18n.general.datePart.long.day,
    ]);
    const now = this.dataForUiHolder.now();
    this.min = dateConstraintAsMoment(this.minDate, now);
    this.max = dateConstraintAsMoment(this.maxDate, now);
    this.fieldInitials = this.fieldNames.map(n => n.charAt(0));
    const yearOptions = range(
      this.min == null ? now.year() - 100 : this.min.year(),
      (this.max == null ? now.year() + 5 : this.max.year()) + 1
    ).map(String).reverse();
    const monthOptions = range(1, 13);
    const dateOptions = range(1, 32).map(String);
    this.options = this.format.applyDateFields([yearOptions, monthOptions.map(String), dateOptions]);
    this.optionLabels = this.format.applyDateFields([
      yearOptions,
      monthOptions.map(i => this.format.shortMonthName(i - 1)),
      dateOptions
    ]);
  }

  setValue(value: string, notifyChanges = false) {
    super.setValue(value, notifyChanges);
    this.onValueInitialized(value);
  }

  onValueInitialized(raw: string): void {
    let partValue = ['', '', ''];
    if (!empty(raw)) {
      const mmt = moment(raw);
      if (mmt.isValid()) {
        partValue = this.format.applyDateFields(
          [String(mmt.year()), String(mmt.month() + 1), String(mmt.date())]
        );
      }
    }
    this.partControls.setValue(partValue, { emitEvent: false });
  }

  protected getFocusableControl() {
    return this.parts.first;
  }

  protected getDisabledValue(): string {
    return this.format.formatAsDate(this.value);
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    const errors: ValidationErrors = {};
    const value = c.value;
    if (empty(value)) {
      // Don't validate empty values
      return null;
    } else if (value === undefined) {
      // The value is already pre-validated with error
      errors.date = true;
    } else {
      const mmnt = moment(value);
      if (!mmnt.isValid()) {
        errors.date = true;
      }
      if (this.min != null && mmnt.isBefore(this.min)) {
        errors.minDate = {
          min: this.format.formatAsDate(this.min)
        };
      }
      if (this.max != null && mmnt.isAfter(this.max)) {
        errors.maxDate = {
          max: this.format.formatAsDate(this.max)
        };
      }
    }
    return Object.keys(errors).length === 0 ? null : errors;
  }

  onPartChanged(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value === '') {
      this.setValue(null, true);
    }
    this.notifyTouched();
  }

  onShown() {
    this.calendar.forEach(c => c.prepare());

    const toggle: HTMLElement = this.toggleRef.nativeElement;

    const rect = toggle.getBoundingClientRect();
    const docHeight = (window.innerHeight || document.documentElement.clientHeight);
    this.dropdown.dropup = rect.bottom > docHeight - 100;

    // Workaround: ngx-bootstrap sets top sometimes when we set dropup, which causes a position error
    // setTimeout(() => menu.style.top = '', 1);

    if (this.layout.ltsm) {
      // For small screens, the datepicker is shown centered with a backdrop
      this.layout.showBackdrop(() => this.dropdown.hide());
    }
  }

  onHidden() {
    this.calendar.forEach(c => c.clearShortcuts());
    this.layout.hideBackdrop();
  }

  selectFromCalendar(date: Moment) {
    this.dropdown.hide();
    this.valueAsMoment = date;
  }
}
