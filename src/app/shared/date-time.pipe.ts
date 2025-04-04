import { Pipe, PipeTransform } from '@angular/core';
import { FormatService } from 'app/core/format.service';

/**
 * Pipe used to format a date / string as date / time using the current configuration
 */
@Pipe({
  name: 'dateTime'
})
export class DateTimePipe implements PipeTransform {
  constructor(private formatService: FormatService) {}

  public transform(value: string | Date): string {
    return this.formatService.formatAsDateTime(value);
  }
}
