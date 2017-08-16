import { Component, OnInit, Input, forwardRef, Output, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl, AbstractControl, ValidationErrors, NgControl, Validator, NG_VALIDATORS } from "@angular/forms";
import { CustomFieldTypeEnum, CustomFieldDetailed } from "app/api/models";
import { MdInputContainer, MdCheckbox, MdSelect } from "@angular/material";
import { FormatService } from "app/core/format.service";
import { DecimalFieldComponent } from "app/shared/decimal-field.component";
import { DateFieldComponent } from "app/shared/date-field.component";

const MAX_INTEGER: number = 2147483647;

// Definition of the exported NG_VALUE_ACCESSOR provider
export const CUSTOM_FIELD_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CustomFieldInputComponent),
  multi: true
};

// Definition of the exported NG_VALUE_ACCESSOR provider
export const CUSTOM_FIELD_VALIDATOR = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => CustomFieldInputComponent),
  multi: true
};

/**
 * Component used to edit a custom field value
 * TODO: Once material angular supports native date inputs, use it
 */
@Component({
  selector: 'custom-field-input',
  templateUrl: 'custom-field-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CUSTOM_FIELD_VALUE_ACCESSOR,
    CUSTOM_FIELD_VALIDATOR
  ]
})
export class CustomFieldInputComponent implements OnInit, ControlValueAccessor, Validator {
  constructor(
    private formatService: FormatService
  ) { }

  @Input()
  public field: CustomFieldDetailed;
  public type: CustomFieldTypeEnum;

  private _value: string = null;

  private _fieldValue: any = null;

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };
  private validatorChangeCallback = () => { };

  @ViewChild("stringInput")
  private stringInput: ElementRef;

  @ViewChild("textInput")
  private textInput: ElementRef;

  @ViewChild("booleanComponent")
  private booleanComponent: MdCheckbox;

  @ViewChild("decimalComponent")
  private decimalComponent: DecimalFieldComponent;

  @ViewChild("dateComponent")
  private dateComponent: DateFieldComponent;

  @ViewChild("selectComponent")
  private selectComponent: MdSelect;

  @ViewChild("dynamicComponent")
  private dynamicComponent: MdSelect;

  @Input()
  @Output()
  public get fieldValue(): any {
    return this._fieldValue;
  }

  public set fieldValue(fieldValue: any) {
    this._fieldValue = fieldValue;
    if (fieldValue instanceof Array) {
      // A multi selection
      this._value = fieldValue.join('|');
    } else if (this.field.type == CustomFieldTypeEnum.INTEGER) {
      let num = Number(fieldValue);
      if (num != null && num > MAX_INTEGER) {
        // 3 assignments :-O
        this.stringInput.nativeElement.value = this._fieldValue = this._value = MAX_INTEGER.toString();
      }
    } else {
      this._value = fieldValue;
    }
    this.emitValue();
  }

  @Output()
  @Input()
  get value(): string {
    return this._value
  }
  set value(value: string) {
    if (this._value === value) {
      return;
    }
    if (this.type == CustomFieldTypeEnum.MULTI_SELECTION) {
      // A multi selection - split the array
      this._fieldValue = (value || "").split("|");
    } else {
      // Just use the field value as the raw value
      this._fieldValue = value;
    }
    this._value = value;
    this.emitValue();
  }

  private emitValue(): void {
    this.changeCallback(this._value);
    this.validatorChangeCallback();
  }

  ngOnInit() {
    this.type = this.field.type;
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
    if (this.stringInput) this.stringInput.nativeElement.disabled = isDisabled;
    if (this.textInput) this.textInput.nativeElement.disabled = isDisabled;
    if (this.booleanComponent) this.booleanComponent.disabled = isDisabled;
    if (this.decimalComponent) this.decimalComponent.disabled = isDisabled;
    if (this.dateComponent) this.dateComponent.disabled = isDisabled;
    if (this.selectComponent) this.selectComponent.disabled = isDisabled;
    if (this.dynamicComponent) this.dynamicComponent.disabled = isDisabled;
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    let value = c.value;
    if (this.field.required && (value === null || value === '')) {
      return {
        required: true
      }
    } else if (this.type == CustomFieldTypeEnum.DATE) {
      // For dates, undefined means invalid
      if (value === undefined) {
        return {
          date: {
            format: this.formatService.dateFormat
          }
        }
      }
    }
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }
}