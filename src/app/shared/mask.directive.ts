import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgControl } from "@angular/forms";

const ALLOWED = [
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "End", "Home", "Delete", "Backspace", "Tab",
  "Shift", "Control", "Alt", "Super", "Meta"
];

var DIGITS: string = "";
for (let i = 0; i <= 9; i++) {
  DIGITS += i.toString();
}
var LOWER: string = "";
for (let i = 'a'; i <= 'z'; i = String.fromCodePoint(i.codePointAt(0) + 1)) {
  LOWER += i;
}
var UPPER: string = LOWER.toUpperCase();
var LETTERS: string = LOWER + UPPER;
var ALPHA: string = DIGITS + LETTERS;

class MaskField {
  constructor(
    public allowed: string, 
    public literal: boolean = false,
    private tx: (c: string) => string = null) { }

  transform(c: string): string {
    if (this.literal) {
      return this.allowed;
    } else if (this.tx) {
      return this.tx(c);
    } else {
      return c;
    }
  }

  accepted(c: string): boolean {
    if (this.allowed == null || this.literal) {
      return true;
    } else {
      return this.allowed.indexOf(c) >= 0;
    }
  }
}
const MASK_DIGIT = '#' + DIGITS;
const MASK_LETTER = 'aA';
const MASK_LOWER = 'lL';
const MASK_UPPER = 'uU';
const MASK_CAPITAL = 'cC';
const MASK_ANY = '?_';

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

  private fields: MaskField[];

  @Input() 
  set mask(mask: string) {
    if (!mask) {
      this.fields = null;
      return;
    } 

    this.fields = [];
    let wasEscape = false;
    let wasCapital = false;
    for (let i = 0; i < mask.length; i++) {
      let c = mask.charAt(i);
      let field: MaskField = null;
      let isEscape = false;
      let isCapital = false;
      if (wasEscape) {
        field = new MaskField(c, true);
      } else if (c == '\\') {
        isEscape = true;
      } else if (MASK_ANY.indexOf(c) >= 0) {
        field = new MaskField(null);
      } else if (MASK_DIGIT.indexOf(c) >= 0) {
        field = new MaskField(DIGITS);
      } else if (MASK_LETTER.indexOf(c) >= 0) {
        field = new MaskField(LETTERS);
      } else if (MASK_LOWER.indexOf(c) >= 0) {
        field = new MaskField(LETTERS, false, c => c.toLocaleLowerCase());
      } else if (MASK_UPPER.indexOf(c) >= 0) {
        field = new MaskField(LETTERS, false, c => c.toUpperCase());
      } else if (MASK_CAPITAL.indexOf(c) >= 0) {
        const capital = wasCapital;
        field = new MaskField(LETTERS, false, c => {
          if (capital) return c.toLowerCase();
          else return c.toUpperCase();
        });
        isCapital = true;
      } else {
        // Any other is literal
        field = new MaskField(c, true);
      }
      this.fields.push(field);
      wasEscape = isEscape;
      wasCapital = isCapital;
    }
  }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (!this.fields || ALLOWED.indexOf(event.key) >= 0) {
      // Always allowed
      return;
    }

    // Get the caret position
    let el = this.el.nativeElement;
    let value = el.value;
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
    while (field.literal) {
      value = value.substring(0, caret) + field.allowed + value.substr(caret + 1);
      field = this.fields[++caret];
    }

    // Apply the typed character
    if (field.accepted(event.key)) {
      let key = field.transform(event.key);
      value = value.substring(0, caret)
        + key + value.substr(caret + 1);
      el.selectionStart = el.selectionEnd = ++caret;

      // If inserting chars before the end of the string, ensure the rest is still valid
      for (let i = caret; i < this.fields.length && i < value.length + 1; i++) {
        let f = this.fields[i];
        if (i < value.length && !f.accepted(value.charAt(i))) {
          // No longer valid
          value = value.substr(0, i);
          break;
        } else if (caret == value.length && f.literal) {
          value = value.substring(0, caret)
            + f.allowed + value.substr(caret + 1);
          caret++;
        }
      }
    }
    event.preventDefault();

    // Force a change event to be triggered, as we always preventDefault()
    this.control.control.setValue(value);
    this.control.control.updateValueAndValidity();

    // Update the caret
    el.selectionStart = caret;
    el.selectionEnd = caret;
  }
}