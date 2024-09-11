import {
  ChangeDetectionStrategy,
  Component,
  Host,
  HostBinding,
  Injector,
  Input,
  Optional,
  SkipSelf
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  BaseFormFieldWithOptionsComponent,
  FORM_FIELD_WITH_OPTIONS
} from 'app/shared/base-form-field-with-options.component';
import { FieldOption } from 'app/shared/field-option';
import { getValueAsArray, preprocessValueWithSeparator, truthyAttr } from 'app/shared/helper';

/**
 * Component used to display a group of checkboxes to use as a multi-selection field
 */
@Component({
  selector: 'checkbox-group-field',
  templateUrl: 'checkbox-group-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: CheckboxGroupFieldComponent, multi: true },
    { provide: FORM_FIELD_WITH_OPTIONS, useExisting: CheckboxGroupFieldComponent }
  ]
})
export class CheckboxGroupFieldComponent extends BaseFormFieldWithOptionsComponent<string | string[]> {
  @HostBinding('class.d-block') classBlock = true;
  @HostBinding('class.w-100') classW100 = true;

  private _horizontal: boolean | string = false;
  @Input() get horizontal(): boolean | string {
    return this._horizontal;
  }
  set horizontal(horizontal: boolean | string) {
    this._horizontal = truthyAttr(horizontal);
  }

  /**
   * When a separator is set, the value will be a single string, using the given separator.
   * Otherwise, the value will be a string array.
   */
  @Input() separator: string = null;

  /**
   * When given all other options will be enabled only if this master value is selected
   */
  @Input() masterValue: string = null;

  constructor(injector: Injector, @Optional() @Host() @SkipSelf() controlContainer: ControlContainer) {
    super(injector, controlContainer);
  }

  toggle(value: string) {
    const option = this.findOption(value);
    if (option && option.disabled) {
      return;
    }

    let selected = this.selectedValues;
    const index = selected.indexOf(value);
    if (index >= 0) {
      if (value === this.masterValue) {
        //unselecting master value then unselect and disable all dependant options
        selected = [];
        this.allOptions.filter(option => option.value !== this.masterValue).forEach(option => (option.disabled = true));
      } else {
        selected.splice(index, 1);
      }
    } else {
      selected.push(value);
      if (value === this.masterValue) {
        //selecting master value then enable all dependant options
        this.allOptions.forEach(option => (option.disabled = false));
      }
    }
    this.setValue(this.separator == null ? selected : selected.join(this.separator));
  }

  /**
   * Adds an option disabling it if the master option is not selected
   */
  addOption(option: FieldOption) {
    if (this.masterValue && option.value !== this.masterValue) {
      option.disabled = !this.isSelected(this.masterValue);
    }
    super.addOption(option);
  }

  preprocessValue(value: any): string | string[] {
    return preprocessValueWithSeparator(value, this.separator);
  }

  protected getSelectedValues(): string[] {
    return getValueAsArray(this.value, this.separator);
  }

  protected getFocusableControl() {
    return null;
  }
}
