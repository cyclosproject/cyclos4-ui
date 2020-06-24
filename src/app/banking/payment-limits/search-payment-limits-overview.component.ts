import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  DataForBalanceLimitsSearch, DataForPaymentLimitsSearch, GeneralAccountPaymentLimitsResult, QueryFilters, RoleEnum, UserQueryFilters
} from 'app/api/models';
import { PaymentLimitsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { ActiveMenu, Menu } from 'app/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';

type PaymentLimitsSearchParams = QueryFilters & {
  fields?: Array<string>;
  accountType?: string;
  broker?: string;
  brokers?: Array<string>;
  by?: string;
  currency?: string;
  customAmountLimit?: boolean;
  customAmountLimitRange?: Array<string>;
  customAmountPerDayLimit?: boolean;
  customAmountPerDayLimitRange?: Array<string>;
  customAmountPerWeekLimit?: boolean;
  customAmountPerWeekLimitRange?: Array<string>;
  customAmountPerMonthLimit?: boolean;
  customAmountPerMonthLimitRange?: Array<string>;
  groups?: Array<string>;
  user?: string;
};

/**
 * General search for user payment limits
 */
@Component({
  selector: 'search-payment-limits-overview',
  templateUrl: 'search-payment-limits-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPaymentLimitsOverviewComponent
  extends BaseSearchPageComponent<DataForPaymentLimitsSearch, PaymentLimitsSearchParams, GeneralAccountPaymentLimitsResult>
  implements OnInit {

  isCustomPaymentLimit$ = new BehaviorSubject<boolean>(false);
  isCustomDailyLimit$ = new BehaviorSubject<boolean>(false);
  isCustomWeeklyLimit$ = new BehaviorSubject<boolean>(false);
  isCustomMonthlyLimit$ = new BehaviorSubject<boolean>(false);

  constructor(
    injector: Injector,
    private paymentLimitsService: PaymentLimitsService,
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['accountType', 'broker', 'brokers', 'by', 'currency', 'customAmountLimit', 'paymentLimitFrom', 'paymentLimitTo',
      'dailyLimitFrom', 'dailyLimitTo', 'customAmountPerDayLimit', 'customAmountPerWeekLimit', 'weeklyLimitFrom', 'weeklyLimitTo',
      'customAmountPerMonthLimit', 'monthlyLimitFrom', 'monthlyLimitTo', 'groups', 'user'];
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.paymentLimitsService.getAccountPaymentLimitsData().subscribe(data => this.data = data));
  }

  onDataInitialized(data: DataForBalanceLimitsSearch) {
    super.onDataInitialized(data);
    this.form.get('customAmountLimit').valueChanges.subscribe(value => this.isCustomPaymentLimit$.next(value === 'yes'));
    this.form.get('customAmountPerDayLimit').valueChanges.subscribe(value => this.isCustomDailyLimit$.next(value === 'yes'));
    this.form.get('customAmountPerWeekLimit').valueChanges.subscribe(value => this.isCustomWeeklyLimit$.next(value === 'yes'));
    this.form.get('customAmountPerMonthLimit').valueChanges.subscribe(value => this.isCustomMonthlyLimit$.next(value === 'yes'));
  }

  protected doSearch(value: PaymentLimitsSearchParams): Observable<HttpResponse<Array<GeneralAccountPaymentLimitsResult>>> {
    return this.paymentLimitsService.searchAccountPaymentLimits$Response(value);
  }

  protected toSearchParams(value: any): PaymentLimitsSearchParams {
    const params: PaymentLimitsSearchParams = value;
    if (this.isCustomPaymentLimit$.value) {
      params.customAmountLimit = true;
      params.customAmountLimitRange = ApiHelper.rangeFilter(value.paymentLimitFrom, value.paymentLimitTo);
    } else {
      // if there is a customLimit it means "no" because "yes" is already handled
      params.customAmountLimit = value.customAmountLimit ? false : null;
    }
    if (this.isCustomDailyLimit$.value) {
      params.customAmountPerDayLimit = true;
      params.customAmountPerDayLimitRange = ApiHelper.rangeFilter(value.dailyLimitFrom, value.dailyLimitTo);
    } else {
      // if there is a customLimit it means "no" because "yes" is already handled
      params.customAmountPerDayLimit = value.customAmountPerDayLimit ? false : null;
    }
    if (this.isCustomWeeklyLimit$.value) {
      params.customAmountPerWeekLimit = true;
      params.customAmountPerWeekLimitRange = ApiHelper.rangeFilter(value.weeklyLimitFrom, value.weeklyLimitTo);
    } else {
      // if there is a customLimit it means "no" because "yes" is already handled
      params.customAmountPerWeekLimit = value.customAmountPerWeekLimit ? false : null;
    }
    if (this.isCustomMonthlyLimit$.value) {
      params.customAmountPerMonthLimit = true;
      params.customAmountPerMonthLimitRange = ApiHelper.rangeFilter(value.monthlyLimitFrom, value.monthlyLimitTo);
    } else {
      // if there is a customLimit it means "no" because "yes" is already handled
      params.customAmountPerMonthLimit = value.customAmountPerMonthLimit ? false : null;
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

  view(row: GeneralAccountPaymentLimitsResult) {
    return ['/banking', row.user.id, 'account-payment-limits', row.account.type.id];
  }

  resolveMenu() {
    return new ActiveMenu(Menu.ACCOUNT_PAYMENT_LIMITS_OVERVIEW);
  }
}
