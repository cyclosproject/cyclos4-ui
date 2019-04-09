import { ChangeDetectionStrategy, Component, Host, Input, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FIELD_OPTIONS_SORTER, FORM_FIELD_WITH_OPTIONS } from 'app/shared/base-form-field-with-options.component';
import { BaseSelectionFieldComponent } from 'app/shared/base-selection-field.component';
import { blank, empty, getValueAsArray, preprocessValueWithSeparator } from 'app/shared/helper';
import { Messages } from 'app/messages/messages';

/**
 * Component used to display a multi selection field (using a `select` tag).
 * Based on the usages we have, the value is always string.
 */
@Component({
  selector: 'multi-selection-field',
  templateUrl: 'multi-selection-field.component.html',
  styleUrls: ['multi-selection-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: MultiSelectionFieldComponent, multi: true },
    { provide: FORM_FIELD_WITH_OPTIONS, useExisting: MultiSelectionFieldComponent },
  ]
})
export class MultiSelectionFieldComponent extends BaseSelectionFieldComponent<string | string[]> {

  /**
   * When a separator is set, the value will be a single string, using the given separator.
   * Otherwise, the value will be a string array.
   */
  @Input() separator: string = null;

  /**
   * Text displayed when no options is selected
   */
  @Input() emptyLabel: string = null;

  /**
   * When set, considers the elements hierarchical.
   * Should be the property name that will point to the option parent's id or internal name.
   * When hierarchical, assumes the values are correctly sorted.
   */
  @Input() hierarchyProperty: string = null;

  constructor(
    @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    private messages: Messages
  ) {
    super(controlContainer);
  }

  toggle(value: string) {
    let selected = this.selectedValues;
    const index = selected.indexOf(value);
    const option = this.findOption(value);
    const childValues = this.optionsByParent(value).map(o => o.value);
    if (index >= 0) {
      // De-select the value, the parent value and any child values
      selected = selected.filter((v, i) =>
        i !== index && (v !== option.parent) && !childValues.includes(v));
    } else {
      // Select the value and all children
      selected.push(value);
      Array.prototype.push.apply(selected, childValues);
    }
    this.setValue(this.separator == null ? selected : selected.join(this.separator));
  }

  preprocessValue(value: any): string | string[] {
    return preprocessValueWithSeparator(value, this.separator);
  }

  protected getDisplay(): string {
    const selected = this.selectedOptions;
    if (empty(selected)) {
      if (!blank(this.emptyLabel)) {
        return this.emptyLabel;
      } else {
        return this.messages.general.noOptionsSelected;
      }
    } else {
      // When there's a parent option selected, don't show the children, as they're implicit
      const selectedValues = selected.map(o => o.value);
      const toShow = selected.filter(o => !o.parent || !selectedValues.includes(o.parent));
      return toShow.sort(FIELD_OPTIONS_SORTER).map(opt => opt.category ? `${opt.category} - ${opt.text}` : opt.text).join(', ');
    }
  }

  protected getSelectedValues(): string[] {
    return getValueAsArray(this.value, this.separator);
  }

}
