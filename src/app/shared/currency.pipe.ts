import { Pipe, PipeTransform } from '@angular/core';
import { Currency } from 'app/api/models';
import { FormatService } from 'app/core/format.service';
import { truthyAttr } from 'app/shared/helper';

/**
 * Pipe used to format a number as currency
 */
@Pipe({
  name: 'currency',
})
export class CurrencyPipe implements PipeTransform {

  constructor(private formatService: FormatService) {
  }

  public transform(value: string | number, currency: Currency, forceSign: boolean | string = false): string {
    return this.formatService.formatAsCurrency(currency, value, truthyAttr(forceSign));
  }
}
