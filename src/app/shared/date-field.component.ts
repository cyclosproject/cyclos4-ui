import {
  Component, OnInit, Input, Output, ViewChild, EventEmitter,
  forwardRef, ElementRef, Provider, ChangeDetectionStrategy
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormatService } from 'app/core/format.service';
import { LayoutService } from 'app/core/layout.service';
import { MatDatepickerInput } from '@angular/material';
import { isDate } from 'moment';

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
export class DateFieldComponent implements ControlValueAccessor, Validator {
  constructor(
    public formatService: FormatService,
    public layout: LayoutService
  ) { }

  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() disabled: boolean;

  @Input() focused: boolean;
  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  @ViewChild(MatDatepickerInput)
  private input: MatDatepickerInput<string>;

  @ViewChild('input')
  private inputRef: ElementRef;

  private _value: string = null;

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };
  private validatorChangeCallback = () => { };

  get dateFormat(): string {
    return this.formatService.dateFormat;
  }

  @Input()
  get value(): string {
    return this._value;
  }
  set value(value: string) {
    if (this._value === value) {
      return;
    }
    this._value = value;
    this.emitValue();
  }

  private emitValue(): void {
    this.change.emit(this.value);
    this.changeCallback(this.value);
    this.validatorChangeCallback();
  }

  focus() {
    this.inputRef.nativeElement.focus();
  }

  onBlur(event) {
    if (this.touchedCallback) {
      this.touchedCallback();
    }
    this.blur.emit(event);
  }

  // ControlValueAccessor methods
  writeValue(obj: any): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.input.disabled = isDisabled;
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (!this.required && (c.value === '' || c.value == null)) {
      return null;
    }
    return this.input.validate(c);
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }
}
