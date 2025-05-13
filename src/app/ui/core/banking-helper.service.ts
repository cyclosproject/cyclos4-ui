import { Inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  Account,
  AccountKind,
  AccountType,
  AccountWithOwner,
  BaseTransferDataForSearch,
  Image,
  PreselectedPeriod,
  RecurringPaymentStatusEnum,
  TransactionDataForSearch,
  TransactionKind,
  TransactionResult
} from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { FormatService } from 'app/core/format.service';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { blank, empty } from 'app/shared/helper';
import { LoginService } from 'app/ui/core/login.service';

export interface HasTransactionNumberAndId {
  id?: string;
  transactionNumber?: string;
}

/**
 * Helper service for banking functions
 */
@Injectable({
  providedIn: 'root'
})
export class BankingHelperService {
  constructor(
    private dataForFrontendHolder: DataForFrontendHolder,
    private format: FormatService,
    private loginService: LoginService,
    @Inject(I18nInjectionToken) private i18n: I18n
  ) {}

  /**
   * Returns the account types from the logged user permissions, optionally filtering by visibility
   * @param visible When true (default) returns only visible account. When false, returns all accounts.
   */
  ownerAccountTypes(visible = true): AccountType[] {
    const auth = this.dataForFrontendHolder.auth;
    const permissions = auth.permissions || {};
    const banking = permissions.banking || {};
    const accounts = banking.accounts || [];
    return accounts.filter(a => (visible ? a.visible : true)).map(a => a.account.type);
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
   * @param showNumber If true, returns the account number if available
   */
  accountDisplay(account: Account, showNumber = true) {
    if (account.number && showNumber) {
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
  transactionNumberOrId(trans: HasTransactionNumberAndId): string {
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
    form.patchValue({ preselectedPeriod }, { emitEvent: false });
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
   * Returns the avatar icon for the given account
   */
  avatarIcon(account: AccountWithOwner): SvgIcon {
    if (account) {
      return account.kind === 'user' ? SvgIcon.Person : SvgIcon.Briefcase;
    }
    return null;
  }

  /**
   * Returns the avatar image for the given account
   */
  avatarImage(account: AccountWithOwner): Image {
    if (account) {
      return (account.user || {}).image;
    }
    return null;
  }

  /**
   * Returns the user / system account display name
   */
  subjectName(account: AccountWithOwner): string {
    if (account) {
      if (account.kind === AccountKind.USER) {
        // Show the user display
        return account.user.display;
      } else {
        // Show the system account type name
        return account.type.name;
      }
    }
    return '';
  }

  /**
   * Returns the name to be displayed for the given account
   */
  ownerName(account: AccountWithOwner): string {
    if (account.kind === 'system') {
      return this.i18n.account.system;
    } else {
      return (account.user || {}).display;
    }
  }

  /**
   * Returns the path components to navigate to the details of a given transaction
   */
  transactionPath(tx: HasTransactionNumberAndId): string[] {
    return ['/banking', 'transaction', this.transactionNumberOrId(tx)];
  }

  /**
   * Returns the scheduling label for the given transaction result
   */
  scheduling(row: TransactionResult) {
    switch (row.kind) {
      case TransactionKind.SCHEDULED_PAYMENT:
        if (row.authorizationStatus === 'pending') {
          return this.i18n.transaction.schedulingStatus.pendingScheduled;
        } else if (row.installmentCount === 1) {
          const installment = row.firstInstallment || {};
          return this.i18n.transaction.schedulingStatus.scheduledToDate(installment.dueDate);
        } else {
          const count = row.installmentCount;
          const firstOpen = row.firstOpenInstallment;
          if (firstOpen) {
            return this.i18n.transaction.schedulingStatus.openInstallments({
              count: String(count),
              dueDate: this.format.formatAsDate(firstOpen.dueDate)
            });
          } else {
            return this.i18n.transaction.schedulingStatus.closedInstallments(String(count));
          }
        }
      case TransactionKind.RECURRING_PAYMENT:
        if (row.authorizationStatus === 'pending') {
          return this.i18n.transaction.schedulingStatus.pendingRecurring;
        } else {
          switch (row.recurringPaymentStatus) {
            case RecurringPaymentStatusEnum.CLOSED:
              return this.i18n.transaction.schedulingStatus.closedRecurring;
            case RecurringPaymentStatusEnum.CANCELED:
              return this.i18n.transaction.schedulingStatus.canceledRecurring;
            default:
              return this.i18n.transaction.schedulingStatus.openRecurring(
                this.format.formatAsDate(row.nextOccurrenceDate)
              );
          }
        }
      default:
        return this.i18n.transaction.schedulingStatus.direct;
    }
  }

  /**
   * Returns the error message to be shown when there are no accounts to perform a pamtment, taking into account if the user
   * can manage its account visibility.
   */
  noAccountForPaymentErrorMessage() {
    return this.loginService.permissions.banking.accountVisibilitySettings
      ? this.i18n.transaction.noVisibleAccounts(this.i18n.user.profile.accountVisibility)
      : this.i18n.transaction.noAccounts;
  }
}
