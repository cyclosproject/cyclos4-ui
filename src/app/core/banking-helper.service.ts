import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  Account, AccountHistoryResult, AccountKind, BaseTransferDataForSearch,
  PreselectedPeriod, Transaction, TransactionDataForSearch, Transfer
} from 'app/api/models';
import { FormatService } from 'app/core/format.service';
import { ApiHelper } from 'app/shared/api-helper';
import { blank, empty } from 'app/shared/helper';

/**
 * Helper service for banking functions
 */
@Injectable({
  providedIn: 'root'
})
export class BankingHelperService {

  constructor(
    private format: FormatService) {
  }


  /**
   * Returns a display label for the given account
   * @param account The account
   */
  accountDisplay(account: Account) {
    if (account.number) {
      return `${account.type.name} - ${account.number}`;
    } else {
      return account.type.name;
    }
  }

  /**
   * Given an object representing a transfer / transaction, if it has a transaction number,
   * returns it, taking care of escaping the value if it is fully numeric.
   * Otherwise, returns the id.
   * @param trans Either the transfer or transaction
   */
  transactionNumberOrId(trans: Transfer | Transaction | AccountHistoryResult): string {
    if (trans == null) {
      return null;
    }
    return blank(trans.transactionNumber) ? trans.id : ApiHelper.escapeNumeric(trans.transactionNumber);
  }

  /**
   * This method does 2 things:
   * - Makes sure that the data has at least one preselected period
   * - Patches the form value with the default preselected period (doesn't emit the event)
   * @param data The data
   * @param form The filters form
   */
  preProcessPreselectedPeriods(data: BaseTransferDataForSearch | TransactionDataForSearch, form: FormGroup): void {
    // Select the default preselected period
    if (empty(data.preselectedPeriods || [])) {
      // No preselected periods? Create one, so we don't break the logic
      data.preselectedPeriods = [{ defaultOption: true }];
    }
    // Assing an id for each period
    for (let i = 0; i < data.preselectedPeriods.length; i++) {
      data.preselectedPeriods[i]['id'] = i;
    }
    const preselectedPeriod = data.preselectedPeriods.find(p => p.defaultOption);
    form.patchValue({ preselectedPeriod: preselectedPeriod }, { emitEvent: false });
  }

  /**
   * Returns the date period value for transfers / transactions query.
   * Assumes the filters value has a `preselectedPeriod`, as well as separated `periodBegin` and `periodEnd` fields.
   * @param filters The form filters value
   */
  resolveDatePeriod(filters: any): string[] {
    const preselectedPeriod = filters.preselectedPeriod as PreselectedPeriod;
    let beginDate: string = null;
    let endDate: string = null;
    if (preselectedPeriod && preselectedPeriod.begin && preselectedPeriod.end) {
      beginDate = preselectedPeriod.begin;
      endDate = preselectedPeriod.end;
    } else {
      beginDate = filters.periodBegin;
      endDate = filters.periodEnd;
    }
    return ApiHelper.rangeFilter(beginDate, endDate);
  }


  /**
   * Returns the related user / system account display name
   */
  subjectName(row: AccountHistoryResult): string {
    if (row.relatedAccount.kind === AccountKind.USER) {
      // Show the user display
      return row.relatedAccount.user.display;
    } else {
      // Show the system account type name
      return this.format.isNegative(row.amount)
        ? row.type.to.name
        : row.type.from.name;
    }
  }


}
