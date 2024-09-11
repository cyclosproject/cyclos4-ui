import { Component, Inject, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';

/**
 * Shows errors in a field.
 * Cannot use OnPush change detection because Angular forms lack an Observable
 * for touched events. Without it, the `touched` flag in the template is not
 * updated, and the error is not shown.
 * See https://github.com/angular/angular/issues/10887
 */
@Component({
  selector: 'field-errors',
  templateUrl: 'field-errors.component.html'
})
export class FieldErrorsComponent {
  @Input() control: FormControl;

  constructor(@Inject(I18nInjectionToken) private i18n: I18n) {}

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
      return this.i18n.error.field.date;
    } else if (errors.minDate) {
      return this.i18n.error.field.minDate(errors.minDate.min);
    } else if (errors.maxDate) {
      return this.i18n.error.field.maxDate(errors.maxDate.max);
    } else if (errors.number) {
      return this.i18n.error.field.number;
    } else if (errors.minlength) {
      return this.i18n.error.field.minLength(errors.minlength.requiredLength);
    } else if (errors.required) {
      return this.i18n.error.field.required;
    } else if (errors.passwordsMatch) {
      return this.i18n.error.field.passwordsMatch;
    } else if (errors.invalidValuePattern) {
      return this.i18n.error.field.invalidValuePattern;
    } else {
      return this.i18n.error.field.invalid;
    }
  }
}
