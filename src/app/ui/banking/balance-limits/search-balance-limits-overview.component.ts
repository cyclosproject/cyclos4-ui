import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  Currency, DataForBalanceLimitsSearch, GeneralAccountBalanceLimitsResult, QueryFilters, RoleEnum, UserQueryFilters, AccountType
} from 'app/api/models';
import { BalanceLimitsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';

type BalanceLimitsSearchParams = QueryFilters & {
  fields?: Array<string>;
  accountType?: string;
  broker?: string;
  brokers?: Array<string>;
  by?: string;
  currency?: string;
  customLimit?: boolean;
  customLimitRange?: Array<string>;
  customUpperLimit?: boolean;
  customUpperLimitRange?: Array<string>;
  groups?: Array<string>;
  user?: string;
};

/**
 * General search for user balance limits
 */
@Component({
  selector: 'search-balance-limits-overview',
  templateUrl: 'search-balance-limits-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBalanceLimitsOverviewComponent
  extends BaseSearchPageComponent<DataForBalanceLimitsSearch, BalanceLimitsSearchParams, GeneralAccountBalanceLimitsResult>
  implements OnInit {

  isCustomLimit$ = new BehaviorSubject<boolean>(false);
  isCustomUpperLimit$ = new BehaviorSubject<boolean>(false);
  currencies: Currency[] = [];
  singleCurrency: Currency;

  constructor(
    injector: Injector,
    private balanceLimitsService: BalanceLimitsService,
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['accountType', 'broker', 'brokers', 'by', 'currency', 'customLimit', 'limitFrom', 'limitTo', 'customUpperLimit',
      'upperLimitFrom', 'upperLimitTo', 'groups', 'user'];
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.balanceLimitsService.getAccountBalanceLimitsData().subscribe(data => this.data = data));
  }

  onDataInitialized(data: DataForBalanceLimitsSearch) {
    super.onDataInitialized(data);
    // Initialize the currencies
    (data.accountTypes || []).forEach(at => this.currencies.push(at.currency));
    this.singleCurrency = this.currencies.length === 1 ? this.currencies[0] : null;
    this.form.get('customUpperLimit').valueChanges.subscribe(value => this.isCustomUpperLimit$.next(value === 'yes'));
    this.form.get('customLimit').valueChanges.subscribe(value => this.isCustomLimit$.next(value === 'yes'));
    this.addSub(this.form.controls.currency.valueChanges.subscribe(currencyId => this.updateAccountTypes(currencyId)));
    this.headingActions = [this.moreFiltersAction];
  }

  protected doSearch(value: BalanceLimitsSearchParams): Observable<HttpResponse<Array<GeneralAccountBalanceLimitsResult>>> {
    return this.balanceLimitsService.searchAccountBalanceLimits$Response(value);
  }

  protected toSearchParams(value: any): BalanceLimitsSearchParams {
    const params: BalanceLimitsSearchParams = value;
    if (this.isCustomLimit$.value) {
      params.customLimit = true;
      params.customLimitRange = ApiHelper.rangeFilter(value.limitFrom, value.limitTo);
    } else {
      // if there is a customLimit it means "no" because "yes" is already handled
      params.customLimit = value.customLimit ? false : null;
    }
    if (this.isCustomUpperLimit$.value) {
      params.customUpperLimit = true;
      params.customUpperLimitRange = ApiHelper.rangeFilter(value.upperLimitFrom, value.upperLimitTo);
    } else {
      // if there is a customUpperLimit it means "no" because "yes" is already handled
      params.customUpperLimit = value.customUpperLimit ? false : null;
    }
    return params;
  }

  get customLimitOptions(): FieldOption[] {
    const options = [{ value: 'yes', text: this.i18n.general.yes }];
    options.push({ value: 'no', text: this.i18n.general.no });
    return options;
  }

  userSearchFilters(onlyBrokers: boolean): UserQueryFilters {
    const filters: UserQueryFilters = { roles: [RoleEnum.BROKER] };
    if (!onlyBrokers) {
      filters.roles.push(RoleEnum.ADMINISTRATOR);
    }
    return filters;
  }

  updateAccountTypes(currencyId: string) {
    const selectedAccount = this.form.controls.accountType.value;
    if (currencyId && selectedAccount && this.data.accountTypes.find(at => at.id === selectedAccount).currency.id !== currencyId) {
      this.form.controls.accountType.setValue(null);
    }
  }

  accountTypes(): AccountType[] {
    const currency = this.findCurrency(false);
    const types = this.data.accountTypes || [];
    if (currency) {
      return types.filter(t => t.currency.id === currency.id);
    }
    return types;
  }

  findCurrency(useAccountType: boolean): Currency {
    if (this.singleCurrency) {
      return this.singleCurrency;
    }
    const currency = this.form.controls.currency.value;
    if (currency) {
      return this.currencies.find(c => c.id === currency);
    }
    const accountId = this.form.controls.accountType.value;
    if (useAccountType && accountId) {
      return this.data.accountTypes.find(at => at.id === accountId).currency;
    }
    return null;
  }

  currencyDecimalDigits(): number {
    const c = this.findCurrency(true);
    return c ? c.decimalDigits : 2;
  }

  currencyPrefix(): string {
    const c = this.findCurrency(true);
    return c ? c.prefix : null;
  }

  currencySuffix(): string {
    const c = this.findCurrency(true);
    return c ? c.suffix : null;
  }


  showMoreFiltersLabel() {
    return this.i18n.general.moreFilters;
  }

  showLessFiltersLabel() {
    return this.i18n.general.lessFilters;
  }

  view(row: GeneralAccountBalanceLimitsResult) {
    return ['/banking', row.user.id, 'account-balance-limits', row.account.type.id];
  }

  resolveMenu() {
    return new ActiveMenu(Menu.ACCOUNT_BALANCE_LIMITS_OVERVIEW);
  }
}
