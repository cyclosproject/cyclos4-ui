import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AccountTypeWithDefaultMediumBalanceRange,
  BasicProfileFieldInput,
  Currency,
  CustomFieldDetailed, DataForUserBalancesSearch,
  RoleEnum,
  UserAddressResultEnum,
  UserQueryFilters,
  UserWithBalanceResult,
  UsersWithBalanceQueryFilters, UsersWithBalanceSummary
} from 'app/api/models';
import { AccountsService } from 'app/api/services/accounts.service';
import { ApiHelper } from 'app/shared/api-helper';
import { PagedResults } from 'app/shared/paged-results';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { MaxDistance } from 'app/ui/shared/max-distance';
import { Menu } from 'app/ui/shared/menu';
import { ResultType } from 'app/ui/shared/result-type';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

type UserBalancesSearchParams = UsersWithBalanceQueryFilters & {
  fields?: Array<string>;
};

/**
 * Displays the user balances with the summary
 */
@Component({
  selector: 'search-user-balances',
  templateUrl: 'search-user-balances.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchUserBalancesComponent
  extends BaseSearchPageComponent<DataForUserBalancesSearch, UserBalancesSearchParams, UserWithBalanceResult>
  implements OnInit {

  summary$ = new BehaviorSubject<UsersWithBalanceSummary>(null);
  currency$ = new BehaviorSubject<Currency>(null);
  customFieldsInSearch: CustomFieldDetailed[] = [];
  basicFieldsInSearch: BasicProfileFieldInput[] = [];
  fieldsInBasicSearch: any[] = [];
  fieldsInAdvancedSearch: any[] = [];

  showAccountNumber$ = new BehaviorSubject(false);
  showNegativeSince$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    private accountsService: AccountsService,
    private bankingHelper: BankingHelperService,
    public userHelper: UserHelperService
  ) {
    super(injector);
  }

  getFormControlNames() {
    return [
      'accountType', 'minMediumRange', 'maxMediumRange', 'minBalance', 'maxBalance', 'orderBy', 'groups', 'distanceFilter', 'brokers',
      'statuses', 'beginActivationPeriod', 'endActivationPeriod', 'beginCreationPeriod', 'endCreationPeriod', 'beginLastLoginPeriod',
      'customValues', 'endLastLoginPeriod', 'beginNegativeSincePeriod', 'endNegativeSincePeriod', 'notAcceptedAgreements',
      'acceptedAgreements', 'products'
    ];
  }

  ngOnInit() {
    super.ngOnInit();
    this.stateManager.cache('data', this.accountsService.getUserBalancesData()).subscribe(data => this.data = data);
    const allowMap = (((this.login.auth || {}).permissions || {}).users || {}).map;
    this.allowedResultTypes = allowMap ? [ResultType.LIST, ResultType.MAP] : [ResultType.LIST];
  }

  prepareForm(data: DataForUserBalancesSearch) {
    data.fieldsInBasicSearch.forEach(f => {
      var field: any = data.customFields.find(cf => cf.internalName === f);
      if (field) {
        this.customFieldsInSearch.push(field);
      } else {
        field = data.basicFields.find(bf => bf.field === f);
        this.basicFieldsInSearch.push(field);
      }
      this.fieldsInBasicSearch.push(field);
    });
    data.fieldsInAdvancedSearch.forEach(f => {
      var field: any = data.customFields.find(cf => cf.internalName === f);
      if (field) {
        this.customFieldsInSearch.push(field);
      } else {
        field = data.basicFields.find(bf => bf.field === f);
        this.basicFieldsInSearch.push(field);
      }
      this.fieldsInAdvancedSearch.push(field);
    });

    this.form.setControl('profileFields',
      this.fieldHelper.profileFieldsForSearchFormGroup(this.basicFieldsInSearch, this.customFieldsInSearch, data.query.profileFields));
  }

  onDataInitialized(data: DataForUserBalancesSearch) {
    super.onDataInitialized(data);

    const filterAction = this.moreFiltersAction;
    filterAction.breakpoint = null;
    this.headingActions = [filterAction];
    this.exportHelper.headingActions(data.exportFormats, f =>
      this.accountsService.exportUsersWithBalances$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      })).forEach(a => this.headingActions.push(a));
    this.bankingHelper.preProcessPreselectedPeriods(data, this.form);
    this.addSub(this.form.controls.accountType.valueChanges.subscribe(
      accountTypeId => {
        const accType = this.data.accountTypes.find(a => a.id === accountTypeId);
        this.updateYellowRange(accType);
        this.currency$.next(accType.currency);
      }));
    const type = data.accountTypes[0];
    this.currency$.next(type.currency);
    this.updateYellowRange(type);
  }

  onBeforeRender(results: PagedResults<UserWithBalanceResult>) {
    const items = results?.results || [];
    this.showAccountNumber$.next(!!items.find(u => u.accountNumber));
    this.showNegativeSince$.next(!!items.find(u => u.negativeSince));
  }

  protected onResultTypeChanged(resultType: ResultType, previousResultType: ResultType) {
    super.onResultTypeChanged(resultType, previousResultType);
    this.resetPage();
  }

  updateYellowRange(type: AccountTypeWithDefaultMediumBalanceRange): void {
    if (type.defaultMediumBalanceRange != null) {
      this.form.controls.minMediumRange.patchValue(type.defaultMediumBalanceRange.min);
      this.form.controls.maxMediumRange.patchValue(type.defaultMediumBalanceRange.max);
    } else {
      this.form.controls.minMediumRange.patchValue(null);
      this.form.controls.maxMediumRange.patchValue(null);
    }
  }

  userSearchFilters(): UserQueryFilters {
    return { roles: [RoleEnum.BROKER] };
  }

  mapBalance(balance: string) {
    return this.i18n.account.balance + ': ' + balance;
  }

  toAddress(user: UserWithBalanceResult) {
    return user.address;
  }

  getInitialResultType() {
    return ResultType.LIST;
  }

  toSearchParams(value: any): UserBalancesSearchParams {
    const query: UserBalancesSearchParams = value;
    query.ignoreProfileFieldsInList = true;
    query.activationPeriod = ApiHelper.dateRangeFilter(value.beginActivationPeriod, value.endActivationPeriod);
    query.creationPeriod = ApiHelper.dateRangeFilter(value.beginCreationPeriod, value.endCreationPeriod);
    query.lastLoginPeriod = ApiHelper.dateRangeFilter(value.beginLastLoginPeriod, value.endLastLoginPeriod);
    query.negativeSincePeriod = ApiHelper.dateRangeFilter(value.beginNegativeSincePeriod, value.endNegativeSincePeriod);
    query.balanceRange = ApiHelper.rangeFilter(value.minBalance, value.maxBalance);

    if (value.minMediumRange != null && value.maxMediumRange != null) {
      query.mediumBalanceRange = [value.minMediumRange, value.maxMediumRange];
    }

    query.addressResult = this.resultType === ResultType.MAP ? UserAddressResultEnum.ALL : null;

    query.profileFields = this.fieldHelper.toProfileFieldsFilter(value.profileFields);

    const distanceFilter: MaxDistance = value.distanceFilter;
    if (distanceFilter) {
      query.maxDistance = distanceFilter.maxDistance;
      query.latitude = distanceFilter.latitude;
      query.longitude = distanceFilter.longitude;
    }
    query.fields = [];
    return query;
  }

  doSearch(query: UserBalancesSearchParams) {
    return this.accountsService.searchUsersWithBalances$Response(query).pipe(tap(() => {
      this.addSub(this.accountsService.getUserBalancesSummary(query).subscribe(summary => this.summary$.next(summary)));
    }));
  }

  findCurrency(): Currency {
    const account = this.form.controls.accountType.value;
    if (account) {
      return this.data.accountTypes.find(at => at.id === account || at.internalName === account).currency;
    }
    return this.currency$.value;
  }

  currencyDecimalDigits(): number {
    const c = this.findCurrency();
    return c ? c.decimalDigits : 2;
  }

  currencyPrefix(): string {
    const c = this.findCurrency();
    return c ? c.prefix : null;
  }

  currencySuffix(): string {
    const c = this.findCurrency();
    return c ? c.suffix : null;
  }

  /**
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: UserWithBalanceResult): string[] {
    return ['/users', row.id, 'profile'];
  }

  get toLink() {
    return (row: UserWithBalanceResult) => this.path(row);
  }

  resolveMenu() {
    return Menu.ADMIN_USER_BALANCES_OVERVIEW;
  }
}
