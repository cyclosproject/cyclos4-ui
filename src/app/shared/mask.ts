import { empty } from 'app/shared/helper';

let DIGITS = '';
for (let i = 0; i <= 9; i++) {
  DIGITS += i.toString();
}
let LOWER = '';
for (let i = 'a'; i <= 'z'; i = String.fromCodePoint(i.codePointAt(0) + 1)) {
  LOWER += i;
}
const UPPER = LOWER.toUpperCase();
const LETTERS = LOWER + UPPER;
const ALPHA = DIGITS + LETTERS;

/**
 * Represents a field in the mask
 */
export class MaskField {
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
    if (this.allowed == null) {
      // Accepts any
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
 * A mask is composed of several fields.
 * Each one can either represent an input or literal character.
 */
export class Mask {
  fields: MaskField[] = [];

  constructor(mask: string) {
    if (empty(mask)) {
      throw new Error('Empty mask');
    }

    let wasEscape = false;
    let wasCapital = false;
    for (let i = 0; i < mask.length; i++) {
      const c = mask.charAt(i);
      let field: MaskField = null;
      let isEscape = false;
      let isCapital = false;
      if (wasEscape) {
        field = new MaskField(c, true);
      } else if (c === '\\') {
        isEscape = true;
      } else if (MASK_ANY.indexOf(c) >= 0) {
        field = new MaskField(ALPHA);
      } else if (MASK_DIGIT.indexOf(c) >= 0) {
        field = new MaskField(DIGITS);
      } else if (MASK_LETTER.indexOf(c) >= 0) {
        field = new MaskField(LETTERS);
      } else if (MASK_LOWER.indexOf(c) >= 0) {
        field = new MaskField(LETTERS, false, _c => _c.toLocaleLowerCase());
      } else if (MASK_UPPER.indexOf(c) >= 0) {
        field = new MaskField(LETTERS, false, _c => _c.toUpperCase());
      } else if (MASK_CAPITAL.indexOf(c) >= 0) {
        const capital = wasCapital;
        field = new MaskField(LETTERS, false, _c => {
          if (capital) {
            return _c.toLowerCase();
          } else {
            return _c.toUpperCase();
          }
        });
        isCapital = true;
      } else {
        // Any other is literal
        field = new MaskField(c, true);
      }
      if (field) {
        this.fields.push(field);
      }
      wasEscape = isEscape;
      wasCapital = isCapital;
    }
  }

  /**
   * Applies the mask to the given value.
   * Works if the value is already masked.
   */
  apply(value: string): string {
    if (empty(value)) {
      return '';
    }
    const result: string[] = [];
    let f = 0;
    for (let pos = 0; pos < value.length; pos++) {
      const c = value.charAt(pos);
      let field = this.fields[f];
      if (!field) {
        break;
      } else if (field.accepted(c)) {
        result.push(c);
      } else {
        while (field && field.literal) {
          result.push(field.allowed);
          field = this.fields[++f];
        }
        // Don't increment the value
        pos--;
      }
      f++;
    }
    return result.join('');
  }

  /**
   * Returns whether the given value is valid according to the mask
   * @param value The value to be tested
   * @param allowPartial When true will allow partial masked values. When false (default) will only accept full values.
   */
  isValid(value: string, allowPartial = false): boolean {
    if (empty(value)) {
      return false;
    }
    if (value.length > this.fields.length) {
      return false;
    }
    if (value.length < this.fields.length && !allowPartial) {
      return false;
    }
    for (let i = 0; i < value.length; i++) {
      const field = this.fields[i];
      if (!field.accepted(value.charAt(i))) {
        return false;
      }
    }
    return true;
  }
}
