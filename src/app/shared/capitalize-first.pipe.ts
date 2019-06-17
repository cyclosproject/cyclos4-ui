import { Pipe, PipeTransform } from '@angular/core';
import { capitalize } from 'lodash';

/**
 * Converts the first character of string to upper case and the remaining to lower case.
 */
@Pipe({
  name: 'capitalizeFirst'
})
export class CapitalizeFirst implements PipeTransform {

  constructor() { }

  public transform(value: string): string {
    return capitalize(value);
  }

}
