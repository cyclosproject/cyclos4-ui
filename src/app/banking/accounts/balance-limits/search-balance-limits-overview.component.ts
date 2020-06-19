import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DataForBalanceLimitsSearch, GeneralAccountBalanceLimitsResult, QueryFilters, RoleEnum, UserQueryFilters } from 'app/api/models';
import { BalanceLimitsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { ActiveMenu, Menu } from 'app/shared/menu';
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
    this.form.get('customUpperLimit').valueChanges.subscribe(value => this.isCustomUpperLimit$.next(value === 'yes'));
    this.form.get('customLimit').valueChanges.subscribe(value => this.isCustomLimit$.next(value === 'yes'));
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

  view(row: GeneralAccountBalanceLimitsResult) {
    return ['/banking', row.user.id, 'account-balance-limits', row.account.type.id];
  }

  resolveMenu() {
    return new ActiveMenu(Menu.ACCOUNT_BALANCE_LIMITS_OVERVIEW);
  }
}
