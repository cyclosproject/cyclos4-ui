import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AccountHistoryOrderByEnum, AccountHistoryQueryFilters, AccountHistoryResult,
  AccountWithHistoryStatus, Currency, DataForAccountHistory, EntityReference, Image,
  PreselectedPeriod, TransferFilter
} from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { empty } from 'app/shared/helper';


type AccountHistorySearchParams = AccountHistoryQueryFilters & {
  owner: string;
  accountType: string;
  fields?: Array<string>;
};

/**
 * Displays the account history of a given account
 */
@Component({
  selector: 'account-history',
  templateUrl: 'account-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountHistoryComponent
  extends BaseSearchPageComponent<DataForAccountHistory, AccountHistorySearchParams, AccountHistoryResult>
  implements OnInit {

  ownerParam: string;
  typeParam: string;
  self: boolean;
  status$ = new BehaviorSubject<AccountWithHistoryStatus>(null);
  noStatus$ = new BehaviorSubject(false);
  multipleAccounts: boolean;
  showForm$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    private accountsService: AccountsService,
    private bankingHelper: BankingHelperService
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

  getFormControlNames() {
    return [
      'transferFilter', 'preselectedPeriod',
      'periodBegin', 'periodEnd',
      'minAmount', 'maxAmount',
      'transactionNumber', 'direction',
      'user', 'by', 'orderBy'
    ];
  }

  ngOnInit() {
    super.ngOnInit();

    // Get the parameters
    const params = this.route.snapshot.params;
    this.ownerParam = params.owner;
    this.typeParam = params.type;
    this.self = this.authHelper.isSelf(this.ownerParam);

    // Determine whether there are multiple account types
    this.multipleAccounts = this.accountTypes.length > 1;

    // Get the account history data
    this.stateManager.cache('data',
      this.accountsService.getAccountHistoryDataByOwnerAndType({
        owner: this.ownerParam, accountType: this.typeParam
      })
    ).subscribe(data => {
      this.data = data;
    });
  }

  onDataInitialized(data: DataForAccountHistory) {
    super.onDataInitialized(data);
    this.menu.setActiveAccountType(data.account.type);

    this.bankingHelper.preProcessPreselectedPeriods(data, this.form);

    // Set the heading action
    this.printable = true;
    const print = this.printAction;
    print.label = this.i18n.account.printTransactions;
    this.headingActions = [
      this.printAction
    ];

    this.form.patchValue({ 'orderBy': AccountHistoryOrderByEnum.DATE_DESC });

    this.addSub(this.layout.xxs$.subscribe(() => this.updateShowForm()));
    this.addSub(this.moreFilters$.subscribe(() => this.updateShowForm()));
    this.updateShowForm();
  }

  private updateShowForm() {
    this.showForm$.next(
      this.layout.xxs && !empty(this.data.preselectedPeriods) || this.moreFilters
    );
  }

  toSearchParams(value: any): AccountHistorySearchParams {
    const query: AccountHistorySearchParams = cloneDeep(value);
    query.transferFilters = value.transferFilter == null ? [] : [value.transferFilter.id];
    query.datePeriod = this.bankingHelper.resolveDatePeriod(value);
    query.amountRange = ApiHelper.rangeFilter(value.minAmount, value.maxAmount);

    query.fields = [];
    query.owner = this.ownerParam;
    query.accountType = this.typeParam;

    return query;
  }

  doSearch(query: AccountHistorySearchParams) {
    return this.accountsService.searchAccountHistory$Response(query).pipe(tap(() => {
      query.fields = ['status'];
      this.addSub(this.accountsService.getAccountStatusByOwnerAndType(query).subscribe(status => {
        const accountWithStatus = { ...this.data.account, status: (status || {}).status };
        if (accountWithStatus.status == null) {
          // When there's no status (is not visible), show the filters directly
          this.noStatus$.next(true);
          this.moreFilters = true;
          this.headingActions = [
            this.printAction
          ];
        } else {
          this.headingActions = [
            this.moreFiltersAction,
            this.printAction
          ];
        }
        this.status$.next(accountWithStatus);
      }));
    }));
  }

  private get accountTypes(): EntityReference[] {
    const accounts = ((this.login.auth || {}).permissions || {}).banking.accounts.filter(a => a.visible !== false);
    return (accounts || []).map(a => a.account.type);
  }

  subjectName(row: AccountHistoryResult): string {
    return this.bankingHelper.subjectName(row);
  }

  /**
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: AccountHistoryResult): string[] {
    return ['/banking', 'transfer', this.bankingHelper.transactionNumberOrId(row)];
  }

  /**
   * Returns the icon used on the given row's avatar
   * @param row The row
   */
  avatarIcon(row: AccountHistoryResult): string {
    return row.relatedAccount.kind === 'user' ? 'user' : 'account_balance_circle';
  }

  /**
   * Returns the image used on the given row's avatar
   * @param row The row
   */
  avatarImage(row: AccountHistoryResult): Image {
    return row.relatedAccount.kind === 'user' ? row.relatedAccount.user.image : null;
  }

  showMoreFiltersLabel() {
    return this.i18n.general.showFilters;
  }

  showLessFiltersLabel() {
    return this.i18n.general.hideFilters;
  }

  get toLink() {
    return (row: AccountHistoryResult) => this.path(row);
  }

}
