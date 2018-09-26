import { Component, ChangeDetectionStrategy, SkipSelf, Host, Optional, Input, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlContainer } from '@angular/forms';
import { empty, preprocessValueWithSeparator, getValueAsArray } from 'app/shared/helper';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { FORM_FIELD_WITH_OPTIONS, BaseFormFieldWithOptionsComponent } from 'app/shared/base-form-field-with-options.component';

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
  ]
})
export class CheckboxGroupFieldComponent extends BaseFormFieldWithOptionsComponent<string | string[]> {

  @HostBinding('class') clazz = 'd-block';

  /**
   * When a separator is set, the value will be a single string, using the given separator.
   * Otherwise, the value will be a string array.
   */
  @Input() separator: string = null;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private i18n: I18n
  ) {
    super(controlContainer);
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
