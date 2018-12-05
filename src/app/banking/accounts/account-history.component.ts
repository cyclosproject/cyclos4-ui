import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AccountHistoryResult, AccountKind, AccountWithHistoryStatus, Currency,
  DataForAccountHistory, EntityReference, Image, PreselectedPeriod, TransferFilter
} from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';


/**
 * Displays the account history of a given account
 */
@Component({
  selector: 'account-history',
  templateUrl: 'account-history.component.html',
  styleUrls: ['account-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountHistoryComponent
  extends BaseSearchPageComponent<DataForAccountHistory, AccountHistoryResult>
  implements OnInit {

  status$ = new BehaviorSubject<AccountWithHistoryStatus>(null);

  constructor(
    injector: Injector,
    private accountsService: AccountsService
  ) {
    super(injector);
  }

  get type(): EntityReference {
    return this.data == null ? null : this.data.account.type;
  }

  get number(): string {
    return this.data == null ? null : this.data.account.number;
  }

  get currency(): Currency {
    return this.data == null ? null : this.data.account.currency;
  }

  get preselectedPeriods(): PreselectedPeriod[] {
    return this.data == null ? null : this.data.preselectedPeriods;
  }

  get transferFilters(): TransferFilter[] {
    return this.data == null ? null : this.data.transferFilters;
  }

  get title(): string {
    const type = this.type;
    if (type == null) {
      return null;
    }
    const number = this.layout.ltsm ? null : this.number;
    return number == null ? type.name : type.name + ' - ' + number;
  }

  get typeId(): string {
    return this.route.snapshot.params.type;
  }

  getFormControlNames() {
    return [
      'transferFilter', 'preselectedPeriod',
      'periodBegin', 'periodEnd',
      'minAmount', 'maxAmount',
      'transactionNumber', 'direction',
      'user', 'by'
    ];
  }

  ngOnInit() {
    // Resolve the account type
    const type = this.typeId;
    if (type == null) {
      // No account type given - get the first one
      const firstType = this.firstAccountType;
      if (firstType == null) {
        this.notification.error(this.i18n('You have no accounts'));
      } else {
        this.router.navigateByUrl('/banking/account/' + this.firstAccountType);
      }
      return;
    } else {
      super.ngOnInit();
    }

    // Get the account history data
    this.stateManager.cache('data',
      this.accountsService.getAccountHistoryDataByOwnerAndType({
        owner: ApiHelper.SELF, accountType: type
      })
    ).subscribe(data => {
      ApiHelper.preProcessPreselectedPeriods(data, this.form);

      // Set the heading action
      this.printable = true;
      const print = this.printAction;
      print.label = this.i18n('Print transactions');
      this.headingActions = [
        this.moreFiltersAction,
        this.printAction
      ];

      // Only initialize the data once the form is filled-in
      this.data = data;
    });
  }

  doSearch(value) {
    const filter = value.transferFilter as TransferFilter;
    const query: AccountsService.SearchAccountHistoryParams | AccountsService.GetAccountStatusByOwnerAndTypeParams = {
      owner: ApiHelper.SELF, accountType: this.typeId,
      page: value.page, pageSize: value.pageSize,
      transferFilters: filter == null ? [] : [filter.id],
      datePeriod: ApiHelper.resolveDatePeriod(value),
      amountRange: ApiHelper.rangeFilter(value.minAmount, value.maxAmount),
      user: value.user,
      by: value.by,
      transactionNumber: value.transactionNumber,
      direction: value.direction
    };
    return this.accountsService.searchAccountHistoryResponse(query).pipe(tap(() => {
      this.status$.next(null);
      query.fields = ['status'];
      this.addSub(this.accountsService.getAccountStatusByOwnerAndType(query).subscribe(status => {
        const accountWithStatus = { ...this.data.account, status: status.status };
        this.status$.next(accountWithStatus);
      }));
    }));
  }

  private get firstAccountType(): string {
    const accounts = ((this.login.auth || {}).permissions || {}).banking.accounts;
    if (accounts && accounts.length > 0) {
      return ApiHelper.internalNameOrId(accounts[0].account.type);
    } else {
      return null;
    }
  }

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
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: AccountHistoryResult): string[] {
    return ['/banking', 'transfer', ApiHelper.transactionNumberOrId(row)];
  }

  /**
   * Returns the icon used on the given row's avatar
   * @param row The row
   */
  avatarIcon(row: AccountHistoryResult): string {
    return row.relatedAccount.kind === 'user' ? 'account_circle' : 'account_balance_circle';
  }

  /**
   * Returns the image used on the given row's avatar
   * @param row The row
   */
  avatarImage(row: AccountHistoryResult): Image {
    return row.relatedAccount.kind === 'user' ? row.relatedAccount.user.image : null;
  }

  showMoreFiltersLabel() {
    return this.i18n('Show filters');
  }

  showLessFiltersLabel() {
    return this.i18n('Show account status');
  }

  showLessFiltersIcon() {
    return 'account_balance';
  }
}
