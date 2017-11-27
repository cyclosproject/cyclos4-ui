import { Pipe, PipeTransform } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { Currency } from 'app/api/models';

/**
 * Pipe used to format a date / string as time using the current configuration
 */
@Pipe({
  name: 'time'
})
export class TimePipe implements PipeTransform {

  constructor(private formatService: FormatService) {
  }

  public transform(value: string | Date): string {
    return this.formatService.formatAsTime(value);
  }

}