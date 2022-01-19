import { Pipe, PipeTransform } from '@angular/core';
import { Account } from 'app/api/models';

/**
 * Pipe used to format an account, displaying the number (if any) and type
 */
@Pipe({
  name: 'account',
})
export class AccountPipe implements PipeTransform {

  constructor() {
  }

  public transform(account: Account): string {
    if (account.number) {
      return `${account.number} (${account.type.name})`;
    } else {
      return account.type.name;
    }
  }
}
