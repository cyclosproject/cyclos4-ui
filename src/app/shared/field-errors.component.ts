import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Messages } from 'app/messages/messages';

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

  constructor(private messages: Messages) {
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
      return this.messages.error.field.date;
    } else if (errors.minDate) {
      return this.messages.error.field.minDate(errors.minDate.min);
    } else if (errors.maxDate) {
      return this.messages.error.field.minDate(errors.maxDate.max);
    } else if (errors.number) {
      return this.messages.error.field.number;
    } else if (errors.minlength) {
      return this.messages.error.field.minLength(errors.minlength.requiredLength);
    } else if (errors.required) {
      return this.messages.error.field.required;
    } else if (errors.passwordsMatch) {
      return this.messages.error.field.passwordsMatch;
    } else {
      return this.messages.error.field.invalid;
    }
  }
}
