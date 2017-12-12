import {
  Component, Input, Output, ViewChild, EventEmitter, forwardRef, ElementRef,
  Provider, ChangeDetectionStrategy, SkipSelf, Host, Optional, OnInit
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, Validator,
  AbstractControl, ValidationErrors, FormControl, ControlContainer
} from '@angular/forms';
import { FormatService } from 'app/core/format.service';
import { LayoutService } from 'app/core/layout.service';
import { MatDatepickerInput } from '@angular/material';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseControlComponent } from 'app/shared/base-control.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const DATE_FIELD_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DateFieldComponent),
  multi: true
};

// Definition of the exported NG_VALIDATORS provider
export const DATE_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => DateFieldComponent),
  multi: true
};

/**
 * Renders a widget for a date field
 */
@Component({
  selector: 'date-field',
  templateUrl: 'date-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DATE_FIELD_VALUE_ACCESSOR,
    DATE_VALIDATOR
  ]
})
export class DateFieldComponent extends BaseControlComponent<string> implements Validator {
  @Input() required: boolean;
  @Input() placeholder: string;

  @Input() focused: boolean;
  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  @ViewChild(MatDatepickerInput)
  private input: MatDatepickerInput<string>;

  @ViewChild('input')
  private inputRef: ElementRef;

  private validatorChangeCallback = () => { };

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    public formatService: FormatService,
    public layout: LayoutService
  ) {
    super(controlContainer);
  }

  focus() {
    this.inputRef.nativeElement.focus();
  }

  onBlur(event) {
    this.touchedCallback();
    const control = this.formControl;
    if (control) {
      const formatted = this.formatService.formatAsDate(control.value);
      const input = this.inputRef.nativeElement;
      if (input.value !== formatted) {
        input.value = formatted;
      }
    }
    this.blur.emit(event);
  }

  onDisabledChange(isDisabled: boolean) {
    this.input.disabled = isDisabled;
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (c.value === ApiHelper.INVALID_DATE) {
      // Invalid date
      return {
        dateFormat: {
          format: this.formatService.dateFormat
        }
      };
    }
    if (!this.required && (c.value === '' || c.value === null)) {
      return null;
    }
    return this.input.validate(c);
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }
}
