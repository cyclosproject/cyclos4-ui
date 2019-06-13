import { Pipe, PipeTransform } from '@angular/core';
import { FormatService } from 'app/core/format.service';

/**
 * Pipe used to format a boolean value with a key for yes / no
 */
@Pipe({
  name: 'boolean'
})
export class BooleanPipe implements PipeTransform {

  constructor(private formatService: FormatService) {
  }

  public transform(value: boolean): string {
    return this.formatService.formatBoolean(value);
  }
}
