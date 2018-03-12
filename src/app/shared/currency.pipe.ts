import { Pipe, PipeTransform } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { Currency } from 'app/api/models';

/**
 * Pipe used to format a number as currency
 */
@Pipe({
  name: 'currency'
})
export class CurrencyPipe implements PipeTransform {

  constructor(private formatService: FormatService) {
  }

  public transform(value: string | number, currency: Currency, forceSign: boolean = false): string {
    return this.formatService.formatAsCurrency(currency, value, forceSign);
  }
}
