import { AbstractControl, FormGroup, FormArray, FormControl } from '@angular/forms';

/**
 * Copies all properties from the given source to the given destination object
 * @param src The source object
 * @param dest The destination object
 */
export function copyProperties(src: Object, dest: Object, ignore: string[] = []): void {
  for (const name in src) {
    if (src.hasOwnProperty(name) && !ignore.includes(name)) {
      dest[name] = src[name];
    }
  }
}

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '/': '&#x2F;'
};

/**
 * Replaces all markup characters in the given string with the appropriated entities
 * @param value The string to be escaped
 */
export function escapeHtml(value: string, nl2br: boolean = false) {
  if (value == null) {
    return null;
  }
  value = value.replace(/[&<>"'\/]/g, s => entityMap[s]);
  if (nl2br) {
    value = value.replace('\n', '<br>');
  }
  return value;
}

/**
 * Recursively returns all errors from a form control
 * @param control The form control
 */
export function getAllErrors(control: AbstractControl): { [key: string]: any; } | null {
  if (control instanceof FormControl) {
    return control.errors;
  } else if (control instanceof FormArray) {
    const errors = [];
    control.controls.forEach(current => {
      errors.push(getAllErrors(current));
    });
    return errors;
  } else if (control instanceof FormGroup) {
    let hasError = false;
    const result = Object.keys(control.controls).reduce((acc, key) => {
      const current = control.get(key);
      const errors = getAllErrors(current);
      if (errors) {
        acc[key] = errors;
        hasError = true;
      }
      return acc;
    }, {} as { [key: string]: any; });
    return hasError ? result : null;
  } else {
    return null;
  }
}

/**
 * Returns whether the given input is null or empty string or array
 * @param input The input
 */
export function empty(input: string | Array<any>): boolean {
  if (input == null) {
    return true;
  }
  return input.length === 0;
}
