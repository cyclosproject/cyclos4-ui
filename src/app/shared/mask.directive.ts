import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { empty } from 'app/shared/helper';
import { Mask, MaskField } from 'app/shared/mask';

const ALLOWED = [
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'End', 'Home', 'Delete', 'Backspace', 'Tab',
  'Shift', 'Control', 'Alt', 'Super', 'Meta'
];

/**
 * A directive to apply a mask to inputs
 */
@Directive({
  selector: '[mask]'
})
export class MaskDirective {
  constructor(
    private el: ElementRef,
    private control: NgControl
  ) { }

  private _mask: Mask;
  private fields: MaskField[];

  @Input()
  set mask(mask: string) {
    if (empty(mask)) {
      this._mask = null;
      this.fields = null;
    } else {
      this._mask = new Mask(mask);
      this.fields = this._mask.fields;
    }
  }

  /**
   * On keydown, apply the mask
   */
  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (!this._mask || ALLOWED.indexOf(event.key) >= 0 || event.ctrlKey || event.altKey) {
      // Always allowed
      return;
    }

    // Get the caret position
    const el = this.el.nativeElement as HTMLInputElement;
    let value = el.value;
    if (value == null) {
      return;
    }
    let caret = el.selectionStart;
    let selectionEnd = el.selectionEnd;
    if (caret >= this.fields.length) {
      // Already at the end of the mask
      value = value.substr(0, this.fields.length);
      event.preventDefault();
      return;
    }
    if (selectionEnd > caret) {
      // Remove the content within the selection
      value = value.substr(0, caret) + value.substr(selectionEnd + 1);
      selectionEnd = caret;
    }

    // While the field is literal, just fill the value
    let field = this.fields[caret];
    while (field && field.literal) {
      value = value.substring(0, caret) + field.allowed + value.substr(caret + 1);
      field = this.fields[++caret];
    }

    // Apply the typed character
    if (field && field.accepted(event.key)) {
      const key = field.transform(event.key);
      value = value.substring(0, caret)
        + key + value.substr(caret + 1);
      el.selectionStart = el.selectionEnd = ++caret;

      // If inserting chars before the end of the string, ensure the rest is still valid
      for (let i = caret; i < this.fields.length && i < value.length + 1; i++) {
        const f = this.fields[i];
        if (i < value.length && !f.accepted(value.charAt(i))) {
          // No longer valid
          value = value.substr(0, i);
          break;
        } else if (caret === value.length && f.literal) {
          value = value.substring(0, caret)
            + f.allowed + value.substr(caret + 1);
          caret++;
        }
      }
    }
    event.preventDefault();
    event.stopPropagation();

    // Force a change event to be triggered, as we always preventDefault()
    this.control.control.setValue(value);
    this.control.control.updateValueAndValidity();

    // Update the caret
    el.selectionStart = caret;
    el.selectionEnd = caret;
  }

  /**
   * On paste, apply the mask to the pasted value
   */
  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    const el = this.el.nativeElement as HTMLInputElement;
    if (el.value == null || !this._mask) {
      return;
    }
    const caret = el.selectionStart || 0;
    const selectionEnd = el.selectionEnd || el.value.length;

    const value = el.value;
    const text = value.substr(0, caret) + event.clipboardData.getData('text/plain') + value.substr(selectionEnd);
    const masked = this._mask.apply(text);

    event.preventDefault();
    event.stopPropagation();

    // Force a change event to be triggered, as we always preventDefault()
    this.control.control.setValue(masked);
    this.control.control.updateValueAndValidity();

    // Update the caret
    el.selectionStart = masked.length;
    el.selectionEnd = masked.length;
  }

  /**
   * On blur, if the value is not correct, clear it
   */
  @HostListener('blur', ['$event']) onBlur(event: FocusEvent) {
    const el = this.el.nativeElement as HTMLInputElement;
    if (el.value == null || !this._mask) {
      return;
    }
    if (!this._mask.isValid(el.value)) {
      this.control.control.setValue('');
      this.control.control.updateValueAndValidity();
    }
    event.stopPropagation();
  }

}
