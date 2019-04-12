import { ChangeDetectionStrategy, Component, Host, HostBinding, Optional, SkipSelf, Injector } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormFieldWithOptionsComponent, FORM_FIELD_WITH_OPTIONS } from 'app/shared/base-form-field-with-options.component';
import { empty } from 'app/shared/helper';

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
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer
  ) {
    super(injector, controlContainer);
  }

  protected getSelectedValues(): string[] {
    const value = this.value;
    return empty(value) ? [] : [value];
  }

  protected getFocusableControl() {
    return null;
  }

}
