import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { FormControl } from '@angular/forms';

/**
 * Shows errors in a field
 */
@Component({
  selector: 'field-errors',
  templateUrl: 'field-errors.component.html',
  styleUrls: ['field-errors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldErrorsComponent {
  @Input() control: FormControl;

  constructor(private i18n: I18n) {
  }

  get message(): string {
    const errors = this.control.errors;
    if (errors == null) {
      return null;
    }
    if (errors.message) {
      let message = errors.message as string;
      if (!message.endsWith('.')) {
        message += '.';
      }
      return message;
    } else if (errors.date) {
      return this.i18n('Invalid date');
    } else if (errors.minDate) {
      return this.i18n('Should be {{min}} or later', {
        min: errors.minDate.min
      });
    } else if (errors.maxDate) {
      return this.i18n('Should be {{max}} or before', {
        max: errors.maxDate.max
      });
    } else if (errors.number) {
      return this.i18n('Invalid numeric value');
    } else if (errors.minlength) {
      return this.i18n('Should have at least {{min}} characters.', {
        min: errors.minlength.requiredLength
      });
    } else if (errors.required) {
      return this.i18n('This field is required.');
    } else if (errors.passwordsMatch) {
      return this.i18n('The passwords don\'t match.');
    } else {
      return this.i18n('This field is invalid');
    }
  }
}
