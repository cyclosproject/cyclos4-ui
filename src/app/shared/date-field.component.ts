import { Component, OnInit, Input, Output, ViewChild, EventEmitter, forwardRef, ElementRef, Provider, ChangeDetectionStrategy } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from "@angular/forms";
import { FormatService } from "app/core/format.service";
import { LayoutService } from "app/core/layout.service";

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
}

// Check whether native date input is supported
let input = document.createElement("input");
input.setAttribute("type", "date");
let invalid = "invalid-value";
input.setAttribute("value", invalid);
const DATE_INPUT_SUPPORTED = input.value !== invalid;

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
export class DateFieldComponent implements OnInit, ControlValueAccessor, Validator {
  constructor(
    private formatService: FormatService,
    public layout: LayoutService
  ) { }

  @Input() required: boolean;
  @Input() placeholder: string;
  @Input() disabled: boolean;

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };
  private validatorChangeCallback = () => { };

  @Input() focused: boolean;
  @Output() change: EventEmitter<string> = new EventEmitter();
  @Output() blur: EventEmitter<string> = new EventEmitter();

  public dateMask: string;
  public dateFormat: string;

  @ViewChild("input")
  private input: ElementRef;

  private _value: string = null;
  private _fieldValue: string = null;

  @Input() @Output() 
  get value(): string {
    return this._value;
  }
  set value(value: string) {
    if (this._value === value) {
      return;
    }
    if (value == null || value === '') {
      this._value = null;
      this._fieldValue = null;
    } else {
      // The date may have a time component, which is not currently supported
      let pos = value.indexOf('T');
      if (pos >= 0) {
        value = value.substr(0, pos);
      }
      this._value = value;
      if (DATE_INPUT_SUPPORTED) {
        // Native date input suppported - the value is ISO directly
        this._fieldValue = value;
      } else {
        // Using a mask - format the value
        this._fieldValue = this.formatService.formatAsDate(this._value);
      }
    }
    this.emitValue();
  }

  @Input() @Output()
  get fieldValue(): string {
    return this._fieldValue;
  }
  set fieldValue(fieldValue: string) {
    if (fieldValue == null || fieldValue === '') {
      this._fieldValue = null;
      this._value = null;
    } else {
      this._fieldValue = fieldValue;
      if (DATE_INPUT_SUPPORTED) {
        // The field value is an ISO date already
        this._value = fieldValue;
      } else {
        this._value = this.formatService.parseDate(fieldValue);
      }
    }
    this.emitValue();
  }

  ngOnInit() {
    this.dateFormat = this.formatService.dateFormat;
    if (!DATE_INPUT_SUPPORTED) {
      // Will only use a mask if native date picker is not supported
      this.dateMask = this.dateFormat.replace(/\w/g, '#');
    }
  }

  private emitValue(): void {
    this.change.emit(this.value);
    this.changeCallback(this.value);
    this.validatorChangeCallback();
  }

  focus() {
    this.input.nativeElement.focus();
  }

  onBlur(event) {
    if (this.touchedCallback) this.touchedCallback();
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
    this.input.nativeElement.disabled = isDisabled;
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    if (this.formatService.parseDate(this._fieldValue) === undefined) {
      return {
        date: {
          format: this.formatService.dateFormat
        }
      }
    }
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }

}