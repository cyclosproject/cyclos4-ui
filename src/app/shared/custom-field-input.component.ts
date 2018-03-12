import {
  Component, Input, forwardRef, ViewChild, ElementRef,
  ChangeDetectionStrategy, Optional, Host, SkipSelf
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, AbstractControl, FormControl,
  ValidationErrors, Validator, NG_VALIDATORS, ControlContainer, FormBuilder
} from '@angular/forms';
import { CustomFieldTypeEnum, CustomFieldDetailed } from 'app/api/models';
import { MatCheckbox, MatSelect } from '@angular/material';
import { FormatService } from 'app/core/format.service';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { DateFieldComponent } from 'app/shared/date-field.component';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseControlComponent } from 'app/shared/base-control.component';

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
export class CustomFieldInputComponent extends BaseControlComponent<string> implements Validator {

  @Input() focused: boolean;
  @Input() field: CustomFieldDetailed;
  @Input() privacyControl: FormControl;

  type: CustomFieldTypeEnum;

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

  multiSelectControl: FormControl;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private formatService: FormatService,
    private formBuilder: FormBuilder
  ) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.type = this.field.type;

    // The multi selection field's FormControl must contain an array
    if (this.type === CustomFieldTypeEnum.MULTI_SELECTION) {
      const initialValue = (this.formControl.value || '').split('|');
      this.multiSelectControl = this.formBuilder.control(initialValue);
      this.multiSelectControl.valueChanges.subscribe(value => {
        this.formControl.setValue((value || []).join('|'));
      });
    }
  }

  get input(): boolean {
    return INPUT_TYPES.includes(this.type);
  }

  get textarea(): boolean {
    return TEXTAREA_TYPES.includes(this.type);
  }

  onDisabledChange(isDisabled: boolean) {
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
  }
}
