import { ChangeDetectionStrategy, Component, Host, OnInit, Optional, SkipSelf, ViewChild } from '@angular/core';
import {
  AbstractControl, ControlContainer, FormBuilder, FormControl, FormGroup,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, ValidatorFn, FormArray
} from '@angular/forms';
import { CustomFieldSizeEnum } from 'app/api/models';
import { FormatService, ISO_DATE } from 'app/core/format.service';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { blank, empty } from 'app/shared/helper';
import { InputFieldComponent } from 'app/shared/input-field.component';
import * as moment from 'moment-mini-ts';
import { range } from 'lodash';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { LayoutService } from 'app/shared/layout.service';

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

  partControls: FormArray;
  datePickerControl: FormControl;
  options: string[][];
  fieldNames: string[];
  fieldInitials: string[];

  @ViewChild('inputField') inputField: InputFieldComponent;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    formBuilder: FormBuilder,
    public format: FormatService,
    public layout: LayoutService,
    private i18n: I18n) {
    super(controlContainer);
    this.partControls = formBuilder.array(new Array(format.dateFields.length).fill(null));
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
        // There is at least one empty and one non-empty part - invalid date
        this.setValue(undefined);
        return;
      }
    }
    if (parts == null) {
      this.setValue(null);
    } else {
      const value: { year?: number, month?: number, date?: number } = {};
      for (let i = 0; i < parts.length; i++) {
        value[this.format.dateFields[i]] = parseInt(parts[i], 10);
      }
      value.month--;
      const mmnt = moment(value);
      if (mmnt.isValid()) {
        this.setValue(mmnt.format(ISO_DATE));
      } else {
        this.setValue(undefined);
      }
    }
  }

  setFromDate(date: Date) {
    if (date == null) {
      this.partControls.setValue([null, null, null]);
    } else {
      this.partControls.setValue(this.format.applyDateFields(
        [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      ));
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
    if (this.fieldSize == null) {
      this.fieldSize = CustomFieldSizeEnum.SMALL;
    }
    this.fieldNames = this.format.applyDateFields([
      this.i18n('Year'),
      this.i18n('Month'),
      this.i18n('Day'),
    ]);
    this.fieldInitials = this.fieldNames.map(n => n.charAt(0));
    const currentYear = moment().year();
    this.options = this.format.applyDateFields([
      range(currentYear - 100, currentYear + 11).map(String),
      range(1, 13).map(String),
      range(1, 32).map(String),
    ]);

    const validator: ValidatorFn = control => {
      const value = control.value;
      if (empty(value)) {
        // Don't validate empty values
        return null;
      }
      const parsed = this.format.parseAsDate(value);
      if (parsed === undefined) {
        return this.dateError;
      }
      return null;
    };
    // this.internalControl = new FormControl(null, validator);

    // this.addSub(this.internalControl.valueChanges.subscribe((input: string) => {
    //   if (empty(input)) {
    //     this.value = null;
    //   } else {
    //     this.value = this.format.parseAsDate(input);
    //   }
    //   this.formControl.markAsTouched();
    // }));

    // this.addSub(this.formControl.statusChanges.subscribe(() => {
    //   this.internalControl.setErrors(this.formControl.errors);
    // }));
  }

  onValueInitialized(raw: string): void {
    if (!blank(raw)) {
      const mmt = moment(raw);
      if (mmt.isValid()) {
        this.partControls.setValue(this.format.applyDateFields(
          [String(mmt.year()), String(mmt.month() + 1), String(mmt.date())]
        ));
      }
    }
  }

  protected getFocusableControl() {
    return this.inputField;
  }

  protected getDisabledValue(): string {
    return this.format.formatAsDate(this.value);
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    const value = c.value;
    if (value === null || value === '') {
      // Don't validate empty values
      return null;
    } else if (value === undefined) {
      // The value is already pre-validated, as we validate the internal control
      return this.dateError;
    }
    return null;
  }

  private get dateError(): ValidationErrors {
    return {
      date: {
        format: this.format.dateFormat
      }
    };
  }

}
