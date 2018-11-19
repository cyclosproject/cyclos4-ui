import { ChangeDetectionStrategy, Component, Host, Input, OnInit, Optional, SkipSelf, ViewChild } from '@angular/core';
import {
  AbstractControl, ControlContainer, FormArray, FormBuilder, FormControl,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator
} from '@angular/forms';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { CustomFieldSizeEnum } from 'app/api/models';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { FormatService, ISO_DATE } from 'app/core/format.service';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { empty } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { LayoutService } from 'app/shared/layout.service';
import { range } from 'lodash';
import * as moment from 'moment-mini-ts';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';

export type DateConstraint = 'any' | 'today' | 'tomorrow' | 'yesterday' | string;

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

  partControls: FormArray;
  dateControl: FormControl;
  options: string[][];
  optionLabels: string[][];
  fieldNames: string[];
  fieldInitials: string[];

  @ViewChild('inputField') inputField: InputFieldComponent;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    formBuilder: FormBuilder,
    private dataForUiHolder: DataForUiHolder,
    public format: FormatService,
    public layout: LayoutService,
    private bsLocaleService: BsLocaleService,
    private i18n: I18n) {
    super(controlContainer);
    this.partControls = formBuilder.array(new Array(format.dateFields.length).fill(''));
    this.addSub(this.partControls.valueChanges.subscribe(parts => this.setFromParts(parts)));
    this.dateControl = formBuilder.control(null);
    this.addSub(this.dateControl.valueChanges.subscribe(date => this.setFromDate(date)));
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

  get minDateAsDate(): Date {
    const min = this.minDateAsMoment;
    return min ? min.toDate() : null;
  }

  get minDateAsMoment(): moment.Moment {
    return this.dateConstraintAsMoment(this.minDate);
  }

  get maxDateAsDate(): Date {
    const max = this.maxDateAsMoment;
    return max ? max.toDate() : null;
  }

  get maxDateAsMoment(): moment.Moment {
    return this.dateConstraintAsMoment(this.maxDate);
  }

  private dateConstraintAsMoment(date: DateConstraint): moment.Moment {
    switch (date || 'any') {
      case 'any':
        return null;
      case 'today':
        return this.dataForUiHolder.now();
      case 'yesterday':
        return this.dataForUiHolder.now().subtract(1, 'day');
      case 'tomorrow':
        return this.dataForUiHolder.now().add(1, 'day');
      default:
        const min = moment(date);
        if (!min.isValid()) {
          throw new Error(`Got an invalid date constraint: ${date}`);
        }
        return min;
    }
  }

  get valueAsDate(): Date {
    const value = this.value;
    if (empty(value)) {
      return null;
    } else {
      return moment(value).toDate();
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.bsLocaleService.use('cyclos');
    if (this.fieldSize == null) {
      this.fieldSize = CustomFieldSizeEnum.SMALL;
    }
    this.fieldNames = this.format.applyDateFields([
      this.i18n('Year'),
      this.i18n('Month'),
      this.i18n('Day'),
    ]);
    this.fieldInitials = this.fieldNames.map(n => n.charAt(0));
    const now = this.dataForUiHolder.now();
    const min = this.minDateAsMoment;
    const max = this.maxDateAsMoment;
    const yearOptions = range(
      min == null ? now.year() - 100 : min.year(),
      (max == null ? now.year() + 10 : max.year()) + 1
    ).map(String).reverse();
    const monthOptions = range(1, 13);
    const dateOptions = range(1, 32).map(String);
    const localeData = this.dataForUiHolder.localeData;
    this.options = this.format.applyDateFields([yearOptions, monthOptions.map(String), dateOptions]);
    this.optionLabels = this.format.applyDateFields([
      yearOptions,
      monthOptions.map(i => localeData.monthsShort[i - 1]),
      dateOptions
    ]);
  }

  setValue(value: string, notifyChanges = false) {
    super.setValue(value, notifyChanges);
    this.onValueInitialized(value);
  }

  onValueInitialized(raw: string): void {
    let partValue = ['', '', ''];
    let dateValue: Date = null;
    if (raw !== null || raw !== '') {
      const mmt = moment(raw);
      if (mmt.isValid()) {
        partValue = this.format.applyDateFields(
          [String(mmt.year()), String(mmt.month() + 1), String(mmt.date())]
        );
        dateValue = mmt.toDate();
      }
    }
    this.partControls.setValue(partValue, { emitEvent: false });
    this.dateControl.setValue(dateValue, { emitEvent: false });
  }

  protected getFocusableControl() {
    return this.inputField;
  }

  protected getDisabledValue(): string {
    return this.format.formatAsDate(this.value);
  }

  // Validator methods
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
      }
      const min = this.minDateAsMoment;
      if (min != null && mmnt.isBefore(min)) {
        errors.minDate = {
          min: this.format.formatAsDate(min)
        };
      }
      const max = this.maxDateAsMoment;
      if (max != null && mmnt.isAfter(max)) {
        errors.maxDate = {
          max: this.format.formatAsDate(max)
        };
      }
    }
    return Object.keys(errors).length === 0 ? null : errors;
  }

  onPartChanged(event: Event) {
    const select = event.srcElement as HTMLSelectElement;
    if (select.value === '') {
      this.setValue(null, true);
    }
    this.notifyTouched();
  }

}
