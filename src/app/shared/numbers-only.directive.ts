import { Directive, HostListener, Input } from '@angular/core';
import { truthyAttr } from 'app/shared/helper';
import { FormatService } from 'app/core/format.service';

const ALLOWED = [
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'End', 'Home', 'Delete', 'Backspace', 'Tab',
  'Shift', 'Control', 'Alt', 'Super', 'Meta',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
];

/**
 * A directive to only allow digits to be entered by users
 */
@Directive({
  selector: '[numbersOnly]'
})
export class NumbersOnlyDirective {
  private enabled: boolean;

  @Input() set numbersOnly(numbersOnly: boolean | string) {
    this.enabled = truthyAttr(numbersOnly);
  }

  private _allowDecimalSeparator: boolean | string = false;
  @Input() get allowDecimalSeparator(): boolean | string {
    return this._allowDecimalSeparator;
  }
  set allowDecimalSeparator(allow: boolean | string) {
    this._allowDecimalSeparator = truthyAttr(allow);
  }

  constructor(private format: FormatService) {
  }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (this.enabled) {
      let allowed = !event.ctrlKey && !event.altKey;
      if (allowed) {
        allowed = this.allowDecimalSeparator && this.format.decimalSeparator === event.key
          || ALLOWED.includes(event.key);
      }
      if (!allowed) {
        event.preventDefault();
      }
    }
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    if (this.enabled) {
      const data = event.clipboardData.getData('text/plain');
      const regexp = this.allowDecimalSeparator ? new RegExp(`^[\\d\\${this.format.decimalSeparator}]+$`) : /^\d+$/;
      if (!regexp.test(data)) {
        event.preventDefault();
      }
    }
  }
}
