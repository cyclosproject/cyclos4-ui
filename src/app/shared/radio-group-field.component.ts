import { Component, ChangeDetectionStrategy, SkipSelf, Host, Optional, HostBinding } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlContainer } from '@angular/forms';
import { empty } from 'app/shared/helper';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { FORM_FIELD_WITH_OPTIONS, BaseFormFieldWithOptionsComponent } from 'app/shared/base-form-field-with-options.component';

/**
 * Component used to display a group of radios to use as a single-selection field
 */
@Component({
  selector: 'radio-group-field',
  templateUrl: 'radio-group-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: RadioGroupFieldComponent, multi: true },
    { provide: FORM_FIELD_WITH_OPTIONS, useExisting: RadioGroupFieldComponent },
  ]
})
export class RadioGroupFieldComponent extends BaseFormFieldWithOptionsComponent<string> {

  @HostBinding('class') clazz = 'd-block';

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private i18n: I18n
  ) {
    super(controlContainer);
  }

  protected getSelectedValues(): string[] {
    const value = this.value;
    return empty(value) ? [] : [value];
  }

  protected getFocusableControl() {
    return null;
  }

}
