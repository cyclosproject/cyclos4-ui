import { ChangeDetectionStrategy, Component, Host, Input, Optional, SkipSelf, Injector } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FORM_FIELD_WITH_OPTIONS } from 'app/shared/base-form-field-with-options.component';
import { BaseSelectionFieldComponent } from 'app/shared/base-selection-field.component';
import { empty } from 'app/shared/helper';
import { FieldOption } from 'app/shared/field-option';

/**
 * Component used to display a single selection field (using a `select` tag).
 * Based on the usages we have, the value is always string.
 */
@Component({
  selector: 'single-selection-field',
  templateUrl: 'single-selection-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['single-selection-field.component.scss'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: SingleSelectionFieldComponent, multi: true },
    { provide: FORM_FIELD_WITH_OPTIONS, useExisting: SingleSelectionFieldComponent },
  ]
})
export class SingleSelectionFieldComponent extends BaseSelectionFieldComponent<string> {

  /** Can be a boolean, indicating the empty option exists, or the empty option label */
  @Input() emptyOption: boolean | string = false;

  get emptyLabel(): string {
    if (this.emptyOption === true) {
      return '';
    } else if (typeof this.emptyOption === 'string') {
      return this.emptyOption;
    } else {
      return null;
    }
  }

  constructor(
    injector: Injector,
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer) {
    super(injector, controlContainer);
  }

  protected getDisplay(): string {
    const value = this.value;
    if (empty(value)) {
      return this.emptyLabel || '';
    } else {
      return this.getDisabledValue();
    }
  }

  protected getSelectedValues(): string[] {
    const value = this.value;
    return empty(value) ? [] : [value];
  }

  select(option: FieldOption) {
    if (!option.enabled) {
      return;
    }
    this.value = option.value;
    this.close();
  }

  hasEmptyOption() {
    return !(this.emptyOption == null || this.emptyOption === false);
  }

  resolveStyle(option: FieldOption) {
    return option.style + ' level' + option.level;
  }
}
