import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AccountHistoryQueryFilters, AccountHistoryResult, AccountKind,
  AccountWithHistoryStatus, Currency, CustomFieldDetailed, DataForAccountHistory,
  EntityReference, Image, PreselectedPeriod, TransferFilter
} from 'app/api/models';
import { AccountsService } from 'app/api/services/accounts.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { empty, truncate } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHistoryComponent
  extends BaseSearchPageComponent<DataForAccountHistory, AccountHistorySearchParams, AccountHistoryResult>
  implements OnInit {

  truncate = truncate;

  ownerParam: string;
  typeParam: string;
  self: boolean;
  status$ = new BehaviorSubject<AccountWithHistoryStatus>(null);
  noStatus$ = new BehaviorSubject(false);
  multipleAccounts: boolean;
  showForm$ = new BehaviorSubject(false);
  exportActions: HeadingAction[];
  statusForm: FormGroup;
  fieldsInSearch: CustomFieldDetailed[];
  fieldsInList: CustomFieldDetailed[];

  constructor(
    injector: Injector,
    private accountsService: AccountsService,
    private bankingHelper: BankingHelperService,
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
      return this.i18n.account.mobileTitle.account;
    }
    const accountNumber = this.layout.ltsm ? null : this.number;
    return accountNumber == null ? type.name : type.name + ' - ' + accountNumber;
  }

  getFormControlNames() {
    return [
      'transferFilters', 'preselectedPeriod', 'periodBegin', 'periodEnd', 'minAmount', 'maxAmount', 'transactionNumber',
      'direction', 'user', 'by', 'groups', 'channels', 'description', 'orderBy', 'customFields'
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
        owner: this.ownerParam, accountType: this.typeParam,
      }),
    ).subscribe(data => this.data = data);
  }

  prepareForm(data: DataForAccountHistory) {
    this.fieldsInSearch = data.customFields.filter(cf => data.fieldsInBasicSearch.includes(cf.internalName));
    this.fieldsInList = data.customFields.filter(cf => data.fieldsInList.includes(cf.internalName));
    this.form.setControl('customFields', this.fieldHelper.customFieldsForSearchFormGroup(this.fieldsInSearch, data.query.customFields));

    this.bankingHelper.preProcessPreselectedPeriods(data, this.form);

    this.statusForm = new FormGroup({});
    for (const flow of data.transferStatusFlows || []) {
      this.statusForm.addControl(flow.id, new FormControl(null));
    }
    this.form.addControl('statuses', this.statusForm);
  }

  onDataInitialized(data: DataForAccountHistory) {
    super.onDataInitialized(data);
    this.exportActions = this.exportHelper.headingActions(data.exportFormats, f =>
      this.accountsService.exportAccountHistory$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      }));
    this.addSub(this.layout.xxs$.subscribe(() => this.updateShowForm(data)));
    this.addSub(this.moreFilters$.subscribe(() => this.updateShowForm(data)));
    this.updateShowForm(data);
  }

  private updateShowForm(data: DataForAccountHistory) {
    this.showForm$.next(this.layout.xxs && !empty(data.preselectedPeriods) || this.moreFilters);
  }

  toSearchParams(value: any): AccountHistorySearchParams {
    const query: AccountHistorySearchParams = value;
    const statuses = value.statuses;

    query.datePeriod = this.bankingHelper.resolveDatePeriod(value);
    query.amountRange = ApiHelper.rangeFilter(value.minAmount, value.maxAmount);

    query.fields = [];
    query.owner = this.ownerParam;
    query.accountType = this.typeParam;
    query.statuses = Object.values(statuses);
    query.customFields = this.fieldHelper.toCustomValuesFilter(value.customFields);
    return query;
  }

  doSearch(query: AccountHistorySearchParams) {
    // Fetch both the status and the entries in parallel
    const entries = this.accountsService.searchAccountHistory$Response(query);
    const status = this.accountsService.getAccountStatusByOwnerAndType({ ...query, fields: ['status'] });
    return forkJoin([entries, status])
      .pipe(map(res => {
        const [entriesResult, statusResult] = res;
        const accountWithStatus = { ...this.data.account, status: statusResult?.status };
        if (accountWithStatus.status == null) {
          // When there's no status (is not visible), show the filters directly
          this.noStatus$.next(true);
          this.moreFilters = true;
          this.headingActions = this.exportActions;
        } else {
          this.headingActions = [
            this.moreFiltersAction,
            ...this.exportActions
          ];
        }
        this.status$.next(accountWithStatus);
        return entriesResult;
      }));
  }

  private get accountTypes(): EntityReference[] {
    const accounts = ((this.login.auth || {}).permissions || {}).banking.accounts.filter(a => a.visible !== false);
    return (accounts || []).map(a => a.account.type);
  }

  subjectName(row: AccountHistoryResult): string {
    return row.relatedName ?? this.bankingHelper.subjectName(row.relatedAccount);
  }

  /**
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: AccountHistoryResult): string[] {
    return ['/banking', 'transfer', this.data.account.id, this.bankingHelper.transactionNumberOrId(row)];
  }

  /**
   * Returns the icon used on the given row's avatar
   * @param row The row
   */
  avatarIcon(row: AccountHistoryResult): SvgIcon {
    return row.relatedAccount.kind === 'user' ? SvgIcon.PersonCircle : SvgIcon.Briefcase;
  }

  /**
   * Returns the image used on the given row's avatar
   * @param row The row
   */
  avatarImage(row: AccountHistoryResult): Image {
    if (row.image) {
      return row.image;
    }
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

  resolveMenu(data: DataForAccountHistory) {
    const menu = new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: data.account.type });
    if (data.account.kind === AccountKind.SYSTEM) {
      // System accounts are only visible by admins
      return menu;
    }
    return this.menu.userMenu(data.account.user, menu);
  }

  statuses(row: AccountHistoryResult) {
    const keys = Object.keys(row.statuses || {});
    if (keys.length === 0) {
      return '';
    }
    const statuses = [];
    for (const flow of this.data.transferStatusFlows) {
      const statusKey = row.statuses[flow.id] || row.statuses[flow.internalName];
      if (statusKey) {
        const statusValue = flow.statuses.find(st => [st.id, st.internalName].includes(statusKey));
        if (statusValue) {
          statuses.push(statusValue.name);
        }
      }
    }
    return statuses.join(', ');
  }
}
