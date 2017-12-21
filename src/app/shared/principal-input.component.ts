import {
  Component, Input, forwardRef, ViewChild,
  ElementRef, ChangeDetectionStrategy, SkipSelf, Host, Optional
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR, AbstractControl,
  ValidationErrors, Validator, NG_VALIDATORS, ControlContainer
} from '@angular/forms';
import { PrincipalTypeInput, PrincipalTypeKind } from 'app/api/models';
import { CustomFieldInputComponent } from 'app/shared/custom-field-input.component';
import { BaseControlComponent } from 'app/shared/base-control.component';

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
export class PrincipalInputComponent extends BaseControlComponent<string> implements Validator {
  @Input() type: PrincipalTypeInput;

  @Input() focused: boolean | string;

  isCustomField: boolean;

  @ViewChild('textInput')
  private textInput: ElementRef;

  @ViewChild('customFieldInput')
  private customFieldInput: CustomFieldInputComponent;

  private validatorChangeCallback = () => { };

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer
  ) {
    super(controlContainer);
  }

  ngOnInit() {
    super.ngOnInit();
    this.isCustomField = this.type.kind === PrincipalTypeKind.CUSTOM_FIELD;
  }

  // ControlValueAccessor methods
  onDisabledChange(isDisabled: boolean): void {
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
