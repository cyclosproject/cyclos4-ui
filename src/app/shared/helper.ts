/// <reference types="@types/googlemaps" />
import { AbstractControl, FormGroup, FormArray, FormControl } from '@angular/forms';
import { GeographicalCoordinate, Address } from 'app/api/models';
import { LatLngBounds } from '@agm/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { Observable } from 'rxjs';

const FIRST_LABEL = 'A';
const LAST_LABEL = '|';

/**
 * Sets whether the root spinner in the page is visible
 */
export function setRootSpinnerVisible(visible: boolean): void {
  const rootSpinner = document.getElementById('rootSpinner') as HTMLElement;
  rootSpinner.style.display = visible ? '' : 'none';
}

/**
 * Sets the text of the root alert
 */
export function setRootAlert(text: string): void {
  const rootAlertContainer = document.getElementById('rootAlertContainer');
  const rootAlert = document.getElementById('rootAlert');
  rootAlert.innerHTML = text || '';
  rootAlertContainer.style.display = empty(text) ? 'none' : '';
  if (!empty(text)) {
    setRootSpinnerVisible(true);
  }
}

/**
 * Sets the text of the reload application button
 */
export function setReloadButton(text: string): void {
  const reloadButton = document.getElementById('reloadButton');
  reloadButton.innerHTML = text || '';
  reloadButton.style.display = empty(text) ? 'none' : '';
}

/**
 * Returns an unique id
 */
let idCounter = 0;
export function nextId() {
  return `id_${++idCounter}`;
}

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

/**
 * Returns the values of the first non-undefined property value for the given object
 * @param object The object
 * @param properties The properties to attempt
 * @returns undefined if no property were non-null
 */
export function firstProperty(object: Object, ...properties: string[]) {
  for (const name of properties) {
    if (object.hasOwnProperty(name) && object[name] != null) {
      return object[name];
    }
  }
  return undefined;
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
 * Returns whether an @Input() attribute can be considered true.
 * Handles empty strings as true, handling the case of `<tag attr>`.
 * @param val The attribute value
 */
export function truthyAttr(val: any): boolean {
  if (typeof val === 'string') {
    return val === '' || val === 'true';
  }
  return !!val;
}

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
 * Attempt to match a form control from the given locator.
 * @param container May be an `AbstractControl` itself or an onbject in which to match locator's nested properties
 * @param locator The locator
 * @param customValuesProp The property name which holds custom values. Defaults to `customValues`
 */
export function locateControl(container, locator: FormControlLocator, customValuesProp = 'customValues'): AbstractControl {
  let result: AbstractControl;

  if (container instanceof AbstractControl) {
    // The container is the control itself
    result = container;
  } else {
    // Attempt to locate by nested property / index
    const control = container == null ? null : container[locator.nestedProperty] as AbstractControl | AbstractControl[];
    if (control == null) {
      return null;
    } else if (control instanceof AbstractControl) {
      // Single control, such as user or confirmation password
      result = control;
    } else {
      // Control arrays, such as createLandLinePhones or modifyContactInfos
      result = control[locator.nestedIndex || 0];
    }
  }

  // Now try to match the property / custom field
  if (result instanceof FormGroup) {
    if (locator.property) {
      result = result.get(locator.property);
    } else if (locator.customField) {
      const customValues = result.get(customValuesProp);
      if (customValues instanceof FormGroup) {
        result = customValues.get(locator.customField);
      } else {
        result = null;
      }
    }
  }

  return result;
}

/**
 * Sets the focus to the first field
 */
export function focusFirstField() {
  if (document.body.classList.contains('lt-md')) {
    return;
  }
  setTimeout(() => {
    const elements = document.getElementsByClassName('form-control');
    if (elements.length > 0) {
      (elements.item(0) as HTMLInputElement).focus();
    }
  }, 10);
}

/**
 * Sets the focus to the first invalid field
 */
export function focusFirstInvalid() {
  setTimeout(() => {
    const elements = document.getElementsByClassName('is-invalid');
    if (elements.length > 0) {
      (elements.item(0) as HTMLInputElement).focus();
    }
  }, 10);
}

/**
 * Returns whether the given control, or any nested controls, is touched
 * @param control The control
 */
export function isTouched(control: AbstractControl) {
  if (control.touched) {
    return true;
  } else if (control instanceof FormGroup) {
    for (const key of Object.keys(control.controls)) {
      const current = control.get(key);
      if (isTouched(current)) {
        return true;
      }
    }
  } else if (control instanceof FormArray) {
    for (const current of control.controls) {
      if (isTouched(current)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Recursively returns all errors from a control, handling recursively forms and arrays
 * @param control The control
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
 * Validates the given form control. Should be called before submitting forms.
 * Returns whether the form is valid
 */
export function validateBeforeSubmit(control: AbstractControl): boolean {
  let result = true;
  if (control instanceof FormControl) {
    control.markAsTouched({ onlySelf: true });
    control.markAsPending({ onlySelf: true, emitEvent: false });
    control.updateValueAndValidity({ onlySelf: true });
    result = control.valid;
  } else if (control instanceof FormArray) {
    control.controls.forEach(current => {
      if (!validateBeforeSubmit(current)) {
        result = false;
      }
    });
  } else if (control instanceof FormGroup) {
    Object.keys(control.controls).forEach(current => {
      if (!validateBeforeSubmit(control.controls[current])) {
        result = false;
      }
    });
  }
  if (!result) {
    // Focus the first invalid field
    focusFirstInvalid();
  }
  return result;
}

/**
 * Both clears the validators and sets the errors to null
 * @param control The form control
 */
export function clearValidatorsAndErrors(control: AbstractControl): void {
  control.clearValidators();
  control.setErrors(null);
}

/**
 * Returns whether the given input is null or empty (string / array / Map / Set)
 * @param input The input
 */
export function empty(input: any): boolean {
  if (input == null) {
    return true;
  }
  if (input.hasOwnProperty('length')) {
    return input.length === 0;
  }
  if (input.hasOwnProperty('size')) {
    return input.size === 0;
  }
  return false;
}

/**
 * Adds to `empty()` the case that if the input is a string, trims it before checking for emptyness
 */
export function blank(input: any): boolean {
  if (typeof input === 'string') {
    input.trim();
  }
  return empty(input);
}

/**
 * Returns a LatLngBounds containing all the given addresses or coordinates
 * @param locations The coordinates or addresses
 */
export function fitBounds(locations: GeographicalCoordinate[] | Address[]): LatLngBounds {
  if (typeof google === 'undefined' || empty(locations)) {
    return null;
  }
  let bounds = new google.maps.LatLngBounds(null);
  for (const loc of locations) {
    if (loc == null) { continue; }
    let coord: GeographicalCoordinate;
    if (loc.hasOwnProperty('location')) {
      coord = loc['location'] as GeographicalCoordinate;
    } else {
      coord = loc as GeographicalCoordinate;
    }
    if (coord && (coord.latitude != null && coord.longitude != null)) {
      bounds = bounds.extend(new google.maps.LatLng(coord.latitude, coord.longitude));
    }
  }
  return bounds.isEmpty() ? null : bounds as any as LatLngBounds;
}

/**
 * Labels each located address, that is, sets an additional property called `label` on each address with values 'A', 'B', ...
 * Also sets another additional property called `fullName` which is the label plus the name
 * @param addresses The addresses
 * @returns The located addresses
 */
export function labelAddresses(addresses: Address[], i18n: I18n): Address[] {
  const locatedAddresses = addresses.filter(addr => addr.location);
  if (locatedAddresses.length > 1) {
    // Label each address
    let label = null;

    // First, check if there are existing labels
    for (const addr of locatedAddresses) {
      const existing = addr['label'];
      if (existing && (label == null || existing > label)) {
        label = existing;
      }
    }

    if (label == null) {
      // When no previous label exists, start anew
      label = FIRST_LABEL;
    } else {
      // Already increment the label
      label = nextLabel(label);
    }

    for (const addr of locatedAddresses) {
      if (addr['label']) {
        // The address is already labeled
        continue;
      }
      addr['label'] = label;
      addr['fullName'] = i18n({
        value: '{{label}} - {{name}}',
        meaning: 'Address with a map label (single letter), such as `A - Home`'
      }, {
          label: label,
          name: addr.name
        });
      label = nextLabel(label);
    }
  }
  return locatedAddresses;
}

function nextLabel(label: string) {
  return label === LAST_LABEL ? FIRST_LABEL : String.fromCharCode(label.charCodeAt(0) + 1);
}

export interface ResizeResult {
  width: number;
  height: number;
  content: Blob;
}

/**
 * Resizes the given image content to a maximum width and height
 * @param original The original image content
 * @param maxWidth The maximum width
 * @param maxHeight The maximum height
 */
export function resizeImage(original: Blob, maxWidth: number, maxHeight: number): Observable<ResizeResult> {
  return new Observable(observer => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(original);
    img.onload = () => {
      const iw = img.width;
      const ih = img.height;
      const scale = Math.min((maxWidth / iw), (maxHeight / ih));
      const iwScaled = iw * scale;
      const ihScaled = ih * scale;
      if (iw <= iwScaled && ih <= ihScaled) {
        // The image is smaller than the maximum
        observer.next({
          width: iw,
          height: ih,
          content: original
        });
        observer.complete();
        URL.revokeObjectURL(url);
      } else {
        // Use an off-screen canvas to resize the image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = iwScaled;
        canvas.height = ihScaled;
        context.drawImage(img, 0, 0, iwScaled, ihScaled);
        canvas.toBlob(blob => {
          observer.next({
            width: iwScaled,
            height: ihScaled,
            content: blob
          });
          observer.complete();
          URL.revokeObjectURL(url);
        });
      }
    };
    img.onerror = err => {
      observer.error(err);
      observer.complete();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Suitable for preprocessing the value of fields that hold multiple values,
 * but handle them either as string[] or as string with a separator
 * @param value The raw value
 * @param separator The separator
 */
export function preprocessValueWithSeparator(value: any, separator: string): string | string[] {
  if (separator == null) {
    // No separator means value is string[]
    return value == null ? [] : value instanceof Array ? value : String(value).split(separator);
  } else {
    // Has a separator: value is a single string
    return value == null ? null : value instanceof Array ? value.join(separator) : String(value);
  }
}

/**
 * Suitable for getting the value always as array of fields that hold multiple values,
 * but handle them either as string[] or as string with a separator.
 * Explicitly filters out all empty values.
 * @param value The raw value
 * @param separator The separator
 */
export function getValueAsArray(value: any, separator: string): string[] {
  const arr = value == null ? [] : value instanceof Array ? value : String(value).split(separator);
  return arr.filter(v => !empty(v));
}

/**
 * Scrolls vertically to the given position, either in pixels or an element (using the element top position)
 * @param base Either a value in pixes, an element (to its top position) or nothing for the page top
 */
export function scrollTop(base?: number | HTMLElement) {
  if (base == null) {
    base = 0;
  }
  if (typeof base !== 'number') {
    base = base.getBoundingClientRect().top;
  }
  document.body.scrollTop = base;
  document.documentElement.scrollTop = base;
}

/**
 * Returns the first words of a text, up to a maximum length.
 * For example: words('Social Trade Organization', 15) will return 'Social Trade'
 */
export function words(text: string, maxLength: number): string {
  if (blank(text)) {
    return '';
  }
  let result = '';
  for (const part of text.split(/\s+/)) {
    if (result === '' || result.length + part.length + 1 < maxLength) {
      result += ' ' + part;
    } else {
      break;
    }
  }
  return result;
}
