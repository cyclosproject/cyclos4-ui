import { Directive, HostListener, Input } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { truthyAttr } from 'app/shared/helper';

const ALLOWED = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'End',
  'Home',
  'Delete',
  'Backspace',
  'Tab',
  'Shift',
  'Control',
  'Alt',
  'Super',
  'Meta',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9'
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

  private _allowNegative: boolean | string = false;
  @Input() get allowNegative(): boolean | string {
    return this._allowNegative;
  }
  set allowNegative(allow: boolean | string) {
    this._allowNegative = truthyAttr(allow);
  }

  @Input() decimalPlaces: number = -1;

  private _useTransferAmount: boolean | string = false;
  @Input() get useTransferAmount(): boolean | string {
    return this._useTransferAmount;
  }
  set useTransferAmount(useTransferAmount: boolean | string) {
    this._useTransferAmount = truthyAttr(useTransferAmount);
  }

  get allowedValues() {
    if (this.allowNegative) {
      return ['-'].concat(ALLOWED);
    }
    return ALLOWED;
  }

  constructor(private format: FormatService) {}

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (this.enabled) {
      let allowed = !event.ctrlKey && !event.altKey;
      const input = event.target as HTMLInputElement;
      if (allowed) {
        if (this.allowDecimalSeparator) {
          if ([',', '.'].includes(event.key)) {
            // Manually insert the decimal separator
            const val = input.value;
            const sep = this.format.decimalSeparator;
            const selStart = input.selectionStart;
            if (!val.includes(sep) && this.decimalPlaces > 0) {
              input.value = val.substring(0, selStart) + sep + val.substring(input.selectionEnd);
              input.setSelectionRange(selStart + 1, selStart + 1, 'none');
              input.dispatchEvent(new Event('input'));
            }
            allowed = false;
          } else if (/\d/.test(event.key)) {
            // Allow decimal digits only if there's not already more than the max integer digits
            const val = input.value;
            const sepIndex = val.indexOf(this.format.decimalSeparator);
            const selStart = input.selectionStart;
            const maxInts = this._useTransferAmount
              ? this.format.maxTransferAmountIntegers
              : this.format.maxTransactionAmountIntegers;
            if (sepIndex < 0 || selStart < sepIndex) {
              // The cursor is before the decimal separator - limit to the max integer digits
              const intPart = sepIndex >= 0 ? val.substring(0, sepIndex) : val;
              allowed = intPart.length < maxInts;
            } else if (this.decimalPlaces >= 0) {
              // The cursor is after the decimal separator - limit to the number of decimal places
              const decPart = val.substring(sepIndex + 1);
              allowed = decPart.length < this.decimalPlaces;
            }
          } else {
            allowed = ALLOWED.includes(event.key);
          }
        } else {
          allowed = this.allowedValues.includes(event.key);
        }
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
