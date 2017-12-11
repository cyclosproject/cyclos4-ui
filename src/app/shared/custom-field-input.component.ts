import {
  Component, OnInit, Input, forwardRef, Output, ViewChild, ElementRef,
  ChangeDetectionStrategy, Optional, Host, SkipSelf
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, ControlValueAccessor, AbstractControl, FormControl,
  ValidationErrors, Validator, NG_VALIDATORS, ControlContainer
} from '@angular/forms';
import { CustomFieldTypeEnum, CustomFieldDetailed } from 'app/api/models';
import { MatCheckbox, MatSelect } from '@angular/material';
import { FormatService } from 'app/core/format.service';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { DateFieldComponent } from 'app/shared/date-field.component';
import { ApiHelper } from 'app/shared/api-helper';

const MAX_INTEGER = 2147483647;
const INPUT_TYPES = [CustomFieldTypeEnum.STRING, CustomFieldTypeEnum.INTEGER, CustomFieldTypeEnum.URL, CustomFieldTypeEnum.LINKED_ENTITY];
const TEXTAREA_TYPES = [CustomFieldTypeEnum.TEXT, CustomFieldTypeEnum.RICH_TEXT];

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

  @Input() formControl: FormControl;
  @Input() formControlName: string;

  @Input() focused: boolean;
  @Input() field: CustomFieldDetailed;

  type: CustomFieldTypeEnum;

  private _value: string = null;
  private _fieldValue: any = null;

  ApiHelper = ApiHelper;

  @ViewChild('stringInput')
  private stringInput: ElementRef;

  @ViewChild('textInput')
  private textInput: ElementRef;

  @ViewChild('booleanComponent')
  private booleanComponent: MatCheckbox;

  @ViewChild('decimalComponent')
  private decimalComponent: DecimalFieldComponent;

  @ViewChild('dateComponent')
  private dateComponent: DateFieldComponent;

  @ViewChild('selectComponent')
  private selectComponent: MatSelect;

  @ViewChild('dynamicComponent')
  private dynamicComponent: MatSelect;

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };
  private validatorChangeCallback = () => { };

  constructor(
    @Optional() @Host() @SkipSelf()
    private controlContainer: ControlContainer,
    private formatService: FormatService
  ) { }

  ngOnInit() {
    this.type = this.field.type;

    if (this.controlContainer && this.formControlName) {
      const control = this.controlContainer.control.get(this.formControlName);
      if (control instanceof FormControl) {
        this.formControl = control;
      }
    }
  }

  get input(): boolean {
    return INPUT_TYPES.includes(this.type);
  }

  get textarea(): boolean {
    return TEXTAREA_TYPES.includes(this.type);
  }

  @Input()
  public get disabled(): boolean {
    if (this.stringInput) {
      return this.stringInput.nativeElement.disabled;
    }
    if (this.textInput) {
      return this.textInput.nativeElement.disabled;
    }
    if (this.booleanComponent) {
      return this.booleanComponent.disabled;
    }
    if (this.decimalComponent) {
      return this.decimalComponent.disabled;
    }
    if (this.dateComponent) {
      return this.dateComponent.disabled;
    }
    if (this.selectComponent) {
      return this.selectComponent.disabled;
    }
    if (this.dynamicComponent) {
      return this.dynamicComponent.disabled;
    }
    return false;
  }
  public set disabled(isDisabled: boolean) {
    this.disabled = isDisabled;
    if (this.stringInput) {
      this.stringInput.nativeElement.disabled = isDisabled;
    }
    if (this.textInput) {
      this.textInput.nativeElement.disabled = isDisabled;
    }
    if (this.booleanComponent) {
      this.booleanComponent.disabled = isDisabled;
    }
    if (this.decimalComponent) {
      this.decimalComponent.disabled = isDisabled;
    }
    if (this.dateComponent) {
      this.dateComponent.disabled = isDisabled;
    }
    if (this.selectComponent) {
      this.selectComponent.disabled = isDisabled;
    }
    if (this.dynamicComponent) {
      this.dynamicComponent.disabled = isDisabled;
    }
  }

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
    } else if (this.field.type === CustomFieldTypeEnum.INTEGER) {
      const num = Number(fieldValue);
      if (num != null && num > MAX_INTEGER) {
        // 2 assignments
        this._fieldValue = this._value = MAX_INTEGER.toString();
        if (this.stringInput) {
          this.stringInput.nativeElement.value = this._value;
        }
      } else {
        this._value = fieldValue;
      }
    } else {
      this._value = fieldValue;
    }
    this.emitValue();
  }

  @Output()
  @Input()
  get value(): string {
    return this._value;
  }
  set value(value: string) {
    if (this._value === value) {
      return;
    }
    if (this.type === CustomFieldTypeEnum.MULTI_SELECTION) {
      // A multi selection - split the array
      this._fieldValue = (value || '').split('|');
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
  }

  // Validator methods
  validate(c: AbstractControl): ValidationErrors {
    const value = c.value;
    if (this.field.required && (value === null || value === '')) {
      return {
        required: true
      };
    } else if (this.type === CustomFieldTypeEnum.DATE) {
      // For dates, undefined means invalid
      if (value === undefined) {
        return {
          date: {
            format: this.formatService.dateFormat
          }
        };
      }
    }
  }
  registerOnValidatorChange(fn: () => void): void {
    this.validatorChangeCallback = fn;
  }
}
