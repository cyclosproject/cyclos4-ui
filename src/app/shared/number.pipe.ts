import { Pipe, PipeTransform } from '@angular/core';
import { FormatService } from 'app/core/format.service';

/**
 * Pipe used to format a number / string as number using the current configuration
 */
@Pipe({
  name: 'number',
})
export class NumberPipe implements PipeTransform {

  constructor(private formatService: FormatService) {
  }

  public transform(value: string | number, scale = 0): string {
    return this.formatService.formatAsNumber(value, scale);
  }
}
