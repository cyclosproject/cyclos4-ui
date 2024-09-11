import { Pipe, PipeTransform } from '@angular/core';
import { FormatService } from 'app/core/format.service';

/**
 * Pipe used to format a date / string as date using the current configuration
 */
@Pipe({
  name: 'date'
})
export class DatePipe implements PipeTransform {
  constructor(private formatService: FormatService) {}

  public transform(value: string | Date): string {
    return this.formatService.formatAsDate(value);
  }
}
