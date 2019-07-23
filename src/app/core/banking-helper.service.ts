import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  Account, AccountHistoryResult, AccountKind, AccountType, AccountWithOwner,
  BaseTransferDataForSearch, PreselectedPeriod, Transaction, TransactionDataForSearch,
  TransactionKind, Transfer, VoucherCreationTypeEnum, VoucherStatusEnum
} from 'app/api/models';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { FormatService } from 'app/core/format.service';
import { I18n } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { blank, empty } from 'app/shared/helper';

const InverseKinds = [TransactionKind.CHARGEBACK, TransactionKind.PAYMENT_REQUEST, TransactionKind.TICKET];

/**
 * Helper service for banking functions
 */
@Injectable({
  providedIn: 'root'
})
export class BankingHelperService {

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private format: FormatService,
    private i18n: I18n,
  ) { }

  /**
   * Returns the account types from the logged user permissions, optionally filtering by visibility
   * @param visible When true (default) returns only visible account. When false, returns all accounts.
   */
  ownerAccountTypes(visible = true): AccountType[] {
    const dataForUi = this.dataForUiHolder.dataForUi;
    const auth = dataForUi.auth || {};
    const permissions = auth.permissions || {};
    const banking = permissions.banking || {};
    const accounts = banking.accounts || [];
    return accounts.filter(a => visible ? a.visible : true).map(a => a.account.type);
  }

  /**
   * Returns an account type from the logged user permissions by internal name or id
   * @param key The internal name or id
   */
  ownerAccountType(key: string): AccountType {
    return this.ownerAccountTypes().find(t => t.id === key || t.internalName === key);
  }

  /**
   * Returns a display label for the given account
   * @param account The account
   * @param number Return the account number if available
   */
  accountDisplay(account: Account, number = true) {
    if (account.number && number) {
      return `${account.type.name} - ${account.number}`;
    } else {
      return account.type.name;
    }
  }
  /**
   * Returns a display label for the given account owner
   * @param account The account
   */
  accountOwnerDisplay(account: AccountWithOwner) {
    if (account.kind === AccountKind.SYSTEM) {
      return (account.type || {}).name;
    } else {
      return (account.user || {}).display;
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
    return ApiHelper.dateRangeFilter(beginDate, endDate);
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

  /**
   * Returns the voucher status display
   */
  voucherStatus(status: VoucherStatusEnum): string {
    switch (status) {
      case VoucherStatusEnum.REDEEMED:
        return this.i18n.voucher.status.redeemed;
      case VoucherStatusEnum.PENDING:
        return this.i18n.voucher.status.pending;
      case VoucherStatusEnum.OPEN:
        return this.i18n.voucher.status.open;
      case VoucherStatusEnum.EXPIRED:
        return this.i18n.voucher.status.expired;
      case VoucherStatusEnum.CANCELED:
        return this.i18n.voucher.status.canceled;
    }
  }

  /**
   * Returns the voucher creation type display
   */
  voucherCreationType(status: VoucherCreationTypeEnum): string {
    switch (status) {
      case VoucherCreationTypeEnum.BOUGHT:
        return this.i18n.voucher.boughtType;
      case VoucherCreationTypeEnum.GENERATED:
        return this.i18n.voucher.generatedType;
    }
  }

  /**
   * Returns an AccountWithOwner view with kind, user and type filled in, representing either the from or to of the given transaction
   */
  asAccount(transaction: Transaction, from: boolean): AccountWithOwner {
    const inverse = InverseKinds.includes(transaction.kind);
    const fromType = transaction.type.from;
    const toType = transaction.type.to;
    return {
      kind: from ? transaction.fromKind : transaction.toKind,
      user: from ? transaction.fromUser : transaction.toUser,
      type: from ? (inverse ? toType : fromType) : (inverse ? fromType : toType)
    };
  }
}
