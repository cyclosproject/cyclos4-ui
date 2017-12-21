import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { GeneralMessages } from 'app/messages/general-messages';

/**
 * A widget that switches between field visibilities.
 * Has 2 working modes:
 * - If a field is given, assumes the control value is an array with the field names of hidden fields
 * - If no field is given, assumes the control value is the boolean for hidden (true) or public (false)
 */
@Component({
  selector: 'field-privacy',
  templateUrl: 'field-privacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldPrivacyComponent {
  @Input() field: string;
  @Input() control: FormControl;

  constructor(public generalMessages: GeneralMessages) {
  }

  get hidden(): boolean {
    if (this.field) {
      const hiddenFields = <string[]>this.control.value;
      return hiddenFields.includes(this.field);
    } else {
      return this.control.value === true;
    }
  }

  get icon(): string {
    return this.hidden ? 'visibility_off' : 'visibility';
  }

  toggle(event) {
    if (this.field) {
      let hiddenFields = <string[]>this.control.value;
      if (hiddenFields.includes(this.field)) {
        hiddenFields = hiddenFields.filter(el => el !== this.field);
      } else {
        hiddenFields.push(this.field);
      }
      this.control.setValue(hiddenFields);
    } else {
      this.control.setValue(!this.control.value);
    }
    event.stopPropagation();
  }
}
