import {
  Component, ChangeDetectionStrategy, SkipSelf, Host, Optional, ViewChild, OnInit
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, AbstractControl, ControlContainer, NG_VALIDATORS, Validator, ValidationErrors, FormControl, FormBuilder, ValidatorFn
} from '@angular/forms';
import { FormatService } from 'app/core/format.service';
import { empty, blank } from 'app/shared/helper';
import { BaseFormFieldComponent } from 'app/shared/base-form-field.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { CustomFieldSizeEnum } from 'app/api/models';
import * as moment from 'moment-mini-ts';

/**
 * Input used to edit a single date
 */
@Component({
  selector: 'date-field',
  templateUrl: 'date-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: DateFieldComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: DateFieldComponent, multi: true }
  ]
})
export class DateFieldComponent
  extends BaseFormFieldComponent<string> implements Validator, OnInit {

  internalControl: FormControl;

  @ViewChild('inputField') inputField: InputFieldComponent;

  pattern: string;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public format: FormatService) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.fieldSize == null) {
      this.fieldSize = CustomFieldSizeEnum.SMALL;
    }
    this.pattern = this.format.dateFormat.toUpperCase();

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
    this.internalControl = new FormControl(null, validator);

    this.addSub(this.internalControl.valueChanges.subscribe((input: string) => {
      if (empty(input)) {
        this.value = null;
      } else {
        this.value = this.format.parseAsDate(input);
      }
      this.formControl.markAsTouched();
    }));

    this.addSub(this.formControl.statusChanges.subscribe(() => {
      this.internalControl.setErrors(this.formControl.errors);
    }));
  }

  onValueInitialized(raw: string): void {
    if (!blank(raw)) {
      this.internalControl.setValue(moment(raw).toDate());
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
    if (empty(value)) {
      // Don't validate empty values
      return null;
    }
    // The value is already pre-validated, as we validate the internal control
    if (value === undefined) {
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
