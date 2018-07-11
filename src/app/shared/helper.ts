import { AbstractControl, FormGroup, FormArray, FormControl } from '@angular/forms';
import { GeographicalCoordinate, Address } from 'app/api/models';
import { } from '@types/googlemaps';
import { LatLngBounds } from '@agm/core';
import { Messages } from '../messages/messages';

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
    if (coord.latitude != null && coord.longitude != null) {
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
export function labelAddresses(addresses: Address[], messages: Messages): Address[] {
  const locatedAddresses = addresses.filter(addr => addr.location);
  if (locatedAddresses.length > 1) {
    // Label each address
    let label = 'A';
    for (const addr of locatedAddresses) {
      addr['label'] = label;
      addr['fullName'] = messages.addressFullName(label, addr.name);
      label = label === 'Z' ? 'A' : String.fromCharCode(label.charCodeAt(0) + 1);
    }
  }
  return locatedAddresses;
}
