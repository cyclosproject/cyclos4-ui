import { ChangeDetectionStrategy, Component, Host, HostBinding, Injector, Input, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormFieldWithOptionsComponent, FORM_FIELD_WITH_OPTIONS } from 'app/shared/base-form-field-with-options.component';
import { getValueAsArray, preprocessValueWithSeparator } from 'app/shared/helper';

/**
 * Component used to display a group of checkboxes to use as a multi-selection field
 */
@Component({
  selector: 'checkbox-group-field',
  templateUrl: 'checkbox-group-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: CheckboxGroupFieldComponent, multi: true },
    { provide: FORM_FIELD_WITH_OPTIONS, useExisting: CheckboxGroupFieldComponent },
  ],
})
export class CheckboxGroupFieldComponent extends BaseFormFieldWithOptionsComponent<string | string[]> {

  @HostBinding('class.d-block') classBlock = true;
  @HostBinding('class.w-100') classW100 = true;

  /**
   * When a separator is set, the value will be a single string, using the given separator.
   * Otherwise, the value will be a string array.
   */
  @Input() separator: string = null;

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
  ) {
    super(injector, controlContainer);
  }

  toggle(value: string) {
    const selected = this.selectedValues;
    const index = selected.indexOf(value);
    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      selected.push(value);
    }
    this.setValue(this.separator == null ? selected : selected.join(this.separator));
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
