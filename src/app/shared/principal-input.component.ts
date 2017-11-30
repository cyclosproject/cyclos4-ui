import {
  Component, OnInit, Input, forwardRef, ViewChild,
  ElementRef, ChangeDetectionStrategy } from '@angular/core';
import {
  NG_VALUE_ACCESSOR, ControlValueAccessor, AbstractControl,
  ValidationErrors, Validator, NG_VALIDATORS
} from '@angular/forms';
import { PrincipalTypeInput, PrincipalTypeKind } from 'app/api/models';
import { CustomFieldInputComponent } from 'app/shared/custom-field-input.component';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PRINCIPAL_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PrincipalInputComponent),
  multi: true
};

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PRINCIPAL_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => PrincipalInputComponent),
  multi: true
};

/**
 * Component used to edit a principal value
 */
@Component({
  selector: 'principal-input',
  templateUrl: 'principal-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PRINCIPAL_VALUE_ACCESSOR,
    PRINCIPAL_VALIDATOR
  ]
})
export class PrincipalInputComponent implements OnInit, ControlValueAccessor, Validator {

  @Input()
  public type: PrincipalTypeInput;

  @Input()
  public focused: boolean | string;

  @Input()
  public disabled: boolean;

  public isCustomField: boolean;

  private _value: string = null;

  @ViewChild('textInput')
  private textInput: ElementRef;

  @ViewChild('customFieldInput')
  private customFieldInput: CustomFieldInputComponent;

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };
  private validatorChangeCallback = () => { };

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
    this.changeCallback(this._value);
    this.validatorChangeCallback();
  }

  ngOnInit() {
    this.isCustomField = this.type.kind === PrincipalTypeKind.CUSTOM_FIELD;
  }

  // ControlValueAccessor methods
  writeValue(obj: any): void {
    this.value = obj == null ? null : obj.toString();
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.textInput) {
      this.textInput.nativeElement.disabled = isDisabled;
    }
    if (this.customFieldInput) {
      this.customFieldInput.disabled = isDisabled;
    }
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    const value = c.value;
    if (value === null || value === '') {
      // We assume the principal is required.
      return {
        required: true
      };
    }
    if (this.customFieldInput != null) {
      return this.customFieldInput.validate(c);
    }
    return null;
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }
}
