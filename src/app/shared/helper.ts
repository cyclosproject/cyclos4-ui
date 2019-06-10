/// <reference types="@types/googlemaps" />
import { LatLngBounds } from '@agm/core';
import { HttpResponse } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import { Address, GeographicalCoordinate } from 'app/api/models';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { LayoutService } from 'app/shared/layout.service';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, End, Home, PageUp, PageDown } from 'app/shared/shortcut.service';
import download from 'downloadjs';
import { Observable } from 'rxjs';

/** URL for the Google maps red marker */
export const RedMarker = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';

/** URL for the Google maps blue marker */
export const BlueMarker = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';

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
 * Converts the given relative path, or full URL, in a full URL
 */
export function toFullUrl(path: string): string {
  if (blank(path)) {
    return null;
  }
  return new URL(path, window.location.href).href;
}

/**
 * Returns whether the given path or URL is on the same origin as the current page
 */
export function isSameOrigin(pathOrurl: string): boolean {
  if (blank(pathOrurl)) {
    // Assume is the same url as base
    return true;
  }
  const current = new URL(window.location.href);
  const url = new URL(pathOrurl, window.location.href);
  return current.origin === url.origin;
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
 * Clones a form group, array or control
 * @param control The control to clone
 */
export function cloneControl<C extends AbstractControl>(control: C): C {
  let clone: any = null;
  if (control instanceof FormGroup) {
    clone = new FormGroup({}, control.validator, control.asyncValidator);
    const controls = control.controls;
    for (const key of Object.keys(controls)) {
      clone.addControl(key, cloneControl(controls[key]));
    }
  } else if (control instanceof FormArray) {
    const clones = control.controls.map(cloneControl);
    clone = new FormArray(clones, control.validator, control.asyncValidator);
  } else if (control instanceof FormControl) {
    clone = new FormControl(control.value, control.validator, control.asyncValidator);
  }
  return clone;
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
export function fitBounds(locations: (GeographicalCoordinate | Address)[]): LatLngBounds {
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
 * @param isValid When passed in, is a validation function that will retain only valid values
 */
export function preprocessValueWithSeparator(value: any, separator: string, isValid?: (val: string) => boolean): string | string[] {
  let array: string[];
  if (separator == null) {
    // No separator means value is string[]
    array = value == null ? [] : value instanceof Array ? value : [String(value)];
  } else {
    // Has a separator: value is a single string
    array = value == null ? [] : value instanceof Array ? value : String(value).split(separator);
  }
  if (isValid != null) {
    array = array.filter(isValid);
  }
  return (separator == null) ? array : array.join(separator);
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
 * @param px The value, in pixels, or 0 if not specified
 */
export function scrollTop(px?: number) {
  if (px == null) {
    px = 0;
  }
  document.body.scrollTop = px;
  document.documentElement.scrollTop = px;
}

/**
 * Scrolls vertically to the end of the page
 */
export function scrollBottom() {
  scrollTop(document.body.scrollHeight);
}

/** An element reference: either the element itself, an `ElementRef` or the DOM id */
export type ElementReference = HTMLElement | ElementRef | string;

/** Resolves the element from the given reference */
export function resolveElement(el: ElementReference): HTMLElement {
  if (el instanceof HTMLElement) {
    return el;
  } else if (el instanceof ElementRef) {
    return el.nativeElement;
  } else if (typeof el === 'string') {
    return document.getElementById(el);
  }
}

/**
 * Returns the element position within the document
 * @param el The element reference
 */
export function elementPosition(el: ElementReference): {
  top: number, left: number, bottom: number, right: number,
  client: ClientRect | DOMRect
} {
  el = resolveElement(el);
  if (!el) {
    return;
  }
  const bbox = el.getBoundingClientRect();
  const top = bbox.top + (window.pageYOffset || document.documentElement.scrollTop);
  const left = bbox.left + (window.pageXOffset || document.documentElement.scrollLeft);
  return {
    top: top,
    bottom: top + bbox.height,
    left: left,
    right: left + bbox.width,
    client: bbox
  };
}

/**
 * Makes sure the given element is within the visible scroll
 */
export function ensureInScroll(el: ElementReference) {
  el = resolveElement(el);
  if (!el) {
    return;
  }

  // Scroll the element into view
  el.scrollIntoView(false);

  const pos = elementPosition(el);
  const delta = 50;

  // Maybe adjust the position
  if (pos.top < delta) {
    // The element is almost on top. Scroll to top.
    scrollTop();
  } else {
    const body = document.body.getBoundingClientRect();
    if (body.height - pos.bottom < delta) {
      // The element is almost on bottom. Scroll to bottom.
      scrollBottom();
    } else if (window.innerHeight - pos.bottom < delta) {
      // The element bottom is almost on the page bottom. Scroll a bit more to the bottom
      window.scrollBy({ top: delta });
    }
  }
}

/**
 * Returns the first words of a text, up to a maximum length.
 * For example: words('Social Trade Organization', 15) will return 'Social Trade'.
 * If the first word is larger than maxLength, truncates it, appending an ellipsis in the end.
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
  if (result.length > maxLength) {
    result = result.substring(0, maxLength) + '…';
  }
  return result;
}

/**
 * Downloads the content of a response, attempting to get the filename from the `Content-Disposition` header
 */
export function downloadResponse(response: HttpResponse<Blob>) {
  const matcher = (response.headers.get('Content-Disposition') || '').match(/filename=\"([^;]+)\"/);
  let filename = null;
  if (matcher) {
    filename = matcher[1];
  }
  const blob = response.body;
  download(blob, filename);
}

/**
 * Sets the focus on the given control, but only on the desktop, unless the force flag is true
 */
export function focus(control: any, force = false) {
  if (!control) {
    return;
  }
  if (!force && !document.body.classList.contains('gt-sm')) {
    return;
  }
  if (control.nativeElement) {
    // Handle element ref
    control = control.nativeElement;
  }
  if (control instanceof HTMLCollection) {
    // An HTML collection
    control = htmlCollectionToArray(control);
  }
  if (control instanceof Array) {
    // An array
    control = control.find(c => c.focus);
  }
  if (control.focus) {
    setTimeout(() => {
      control.focus();
      ensureInScroll(control);
    }, 1);
  }
}

/**
 * Converts a collection of HTML elements to Array
 * @param collection The HTML collection
 */
export function htmlCollectionToArray(collection: HTMLCollectionOf<any> | NodeListOf<any>): HTMLElement[] {
  const array = new Array<HTMLElement>(collection.length);
  for (let i = 0; i < collection.length; i++) {
    array[i] = collection.item(i);
  }
  return array;
}

/**
 * Returns whether the given element is a children of the other element
 */
export function isChildElement(el: Element, parent: Element) {
  while (el != null) {
    if (el.parentElement === parent) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Set the focus to another focusable element on page, according to a captured keyboard event
 */
export function handleKeyboardFocus(layout: LayoutService, element: ElementReference, event: KeyboardEvent, options?: {
  horizontalOffset?: number;
  verticalOffset?: number
}) {

  element = resolveElement(element);
  if (!element) {
    return false;
  }

  const focusTrap = resolveElement(layout.focusTrap);
  if (layout.gtxs && !focusTrap) {
    // Ignore when not on mobile and there's no focus-trapping element
    return false;
  }

  // Figure out all focusable elements, and sort them in the natural order
  const focusable = htmlCollectionToArray(
    (focusTrap || element).querySelectorAll('input,textarea,select,button,a,.focusable'))
    .filter(e => e.offsetParent != null);
  if (empty(focusable)) {
    // No focusable elements
    return false;
  }
  const bboxes = new Map<HTMLElement, ClientRect | DOMRect>();
  for (const el of focusable) {
    bboxes.set(el, el.getBoundingClientRect());
  }
  focusable.sort((a, b) => {
    const ba = bboxes.get(a);
    const bb = bboxes.get(b);
    if (ba.top < bb.top) {
      return -1;
    } else if (ba.top > bb.top) {
      return 1;
    }
    if (ba.left < bb.left) {
      return -1;
    } else if (ba.left > bb.left) {
      return 1;
    }
    return 0;
  });

  // Now check if any of them is focused
  const index = focusable.indexOf(document.activeElement as HTMLElement);
  if (index < 0) {
    focus(focusable[0], true);
  } else {
    // Calculate the new index
    let offset = 0;
    options = options || {};
    const verticalOffset = options.verticalOffset || 1;
    const horizontalOffset = options.horizontalOffset || 2;
    switch (event.key) {
      case ArrowUp:
        offset = -verticalOffset;
        break;
      case ArrowDown:
        offset = verticalOffset;
        break;
      case ArrowLeft:
        offset = -horizontalOffset;
        break;
      case ArrowRight:
        offset = horizontalOffset;
        break;
    }
    let newIndex = index + offset;
    if (newIndex < 0) {
      // When already on the first and going up, scroll to the top of the page
      if (!focusTrap) {
        focusable[0].blur();
        scrollTop();
      }
    } else {
      if (newIndex > focusable.length - 1) {
        newIndex = focusable.length - 1;
      }
      focus(focusable[newIndex], true);
    }
  }

  event.preventDefault();
  event.stopPropagation();
}

const ArrowOffset = 80;
const PageOffset = 300;
const Offsets = new Map<string, number>();
Offsets.set(ArrowUp, -ArrowOffset);
Offsets.set(ArrowDown, ArrowOffset);
Offsets.set(PageUp, -PageOffset);
Offsets.set(PageDown, PageOffset);
Offsets.set(Home, Number.MIN_SAFE_INTEGER);
Offsets.set(End, Number.MAX_SAFE_INTEGER);

/**
 * Adds keyboard shortcuts to scroll the window
 */
export function handleKeyboardScroll(layout: LayoutService, event: KeyboardEvent) {
  if (layout.gtxs || layout.focusTrap) {
    // Ignore when not on mobile or there's an element trapping focus
    return false;
  }

  const offset = Offsets.get(event.key);
  if (offset) {
    window.scrollBy({ top: offset });
  }

  event.preventDefault();
  event.stopPropagation();
}

/**
 * If the given mouse event is a mouse click, blurs the element.
 * Used to avoid leaving the focus indicator in the clicked element.
 * @param el The element
 * @param event The click event
 */
export function blurIfClick(el: ElementReference, event: MouseEvent) {
  if (event.detail !== 0) {
    const element = resolveElement(el);
    if (element) {
      element.blur();
    }
  }
}
