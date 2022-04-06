import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AccountType, Currency, PreselectedPeriod, RoleEnum,
  TransferDataForSearch, TransferFilter, TransferKind, TransferQueryFilters, TransferResult, TransOrderByEnum, UserQueryFilters
} from 'app/api/models';
import { TransfersService } from 'app/api/services/transfers.service';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

type TransferSearchParams = TransferQueryFilters & {
  fields?: Array<string>;
};

/**
 * General transfers search
 */
@Component({
  selector: 'search-transfers-overview',
  templateUrl: 'search-transfers-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTransfersOverviewComponent
  extends BaseSearchPageComponent<TransferDataForSearch, TransferSearchParams, TransferResult>
  implements OnInit {

  filters$ = new BehaviorSubject<TransferFilter[]>([]);
  singleCurrency: Currency;
  singleAccount: AccountType;
  hasTransactionNumber: boolean;
  transactionNumberPattern: string;

  constructor(
    injector: Injector,
    private transfersService: TransfersService,
    public bankingHelper: BankingHelperService,
  ) {
    super(injector);
  }

  get preselectedPeriods(): PreselectedPeriod[] {
    return this.data == null ? null : this.data.preselectedPeriods;
  }

  getFormControlNames() {
    return [
      'preselectedPeriod',
      'periodBegin', 'periodEnd',
      'groups', 'currency', 'channels',
      'fromAccountTypes', 'toAccountTypes',
      'transferFilters',
      'kinds', 'chargedBack',
      'minAmount', 'maxAmount',
      'transactionNumber',
      'user', 'by', 'orderBy', 'brokers'
    ];
  }

  getInitialFormValue(data: TransferDataForSearch) {
    const value = super.getInitialFormValue(data);
    // Only Cyclos 4.12.2 onwards sends a default order by
    value.orderBy = value.orderBy || TransOrderByEnum.DATE_DESC;
    return value;
  }

  ngOnInit() {
    super.ngOnInit();

    // Get the transfers overview data
    this.stateManager.cache('data',
      this.transfersService.getTransferDataForSearch(),
    ).subscribe(data => {
      this.data = data;
    });
  }

  onDataInitialized(data: TransferDataForSearch) {
    super.onDataInitialized(data);
    this.singleCurrency = (data.currencies || []).length === 1 ? data.currencies[0] : null;
    this.singleAccount = (data.accountTypes || []).length === 1 ? data.accountTypes[0] : null;
    const transactionNumberPatterns = (data.currencies || [])
      .map(c => c.transactionNumberPattern)
      .filter(p => p)
      .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
    this.hasTransactionNumber = transactionNumberPatterns.length > 0;
    this.transactionNumberPattern = transactionNumberPatterns.length === 1 ? transactionNumberPatterns[0] : null;
    this.bankingHelper.preProcessPreselectedPeriods(data, this.form);
    this.addSub(this.form.controls.fromAccountTypes.valueChanges.subscribe(accountTypeId => this.updateTransferFilters(accountTypeId)));
    this.addSub(this.form.controls.currency.valueChanges.subscribe(currencyId => this.updateAccountTypes(currencyId)));

    this.headingActions = [this.moreFiltersAction];
    this.exportHelper.headingActions(data.exportFormats,
      f => this.transfersService.exportTransfers$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      })).forEach(a => this.headingActions.push(a));
  }

  updateTransferFilters(accountTypeId: string) {
    const selectedFilters = this.form.controls.transferFilters.value as string[];
    if (accountTypeId && selectedFilters) {
      this.form.controls.transferFilters.setValue(
        selectedFilters.filter(filterId => this.data.transferFilters.find(tf => tf.id === filterId).accountType.id === accountTypeId));
    }
  }

  updateAccountTypes(currencyId: string) {
    const selectedFrom = this.form.controls.fromAccountTypes.value;
    const selectedTo = this.form.controls.toAccountTypes.value;
    if (currencyId && selectedFrom) {
      const fromCurrency = (this.data.accountTypes.find(at => at.id === selectedFrom) as AccountType).currency;
      this.form.controls.fromAccountTypes.setValue(!fromCurrency || fromCurrency.id === currencyId ? selectedFrom : null);
    }
    if (currencyId && selectedTo) {
      const toCurrency = (this.data.accountTypes.find(at => at.id === selectedTo) as AccountType).currency;
      this.form.controls.toAccountTypes.setValue(!toCurrency || toCurrency.id === currencyId ? selectedTo : null);
    }
  }

  userSearchFilters(): UserQueryFilters {
    return { roles: [RoleEnum.BROKER] };
  }

  findCurrency(useAccountType: boolean): Currency {
    if (this.singleCurrency) {
      return this.singleCurrency;
    }
    const currency = this.form.controls.currency.value;
    if (currency) {
      return this.data.currencies.find(c => c.id === currency);
    }
    const fromAccountId = this.form.controls.fromAccountTypes.value;
    if (useAccountType && fromAccountId) {
      return (this.data.accountTypes.find(at => at.id === fromAccountId) as AccountType)?.currency;
    }
    return null;
  }

  transferFilters(): TransferFilter[] {
    const fromAccount = this.form.controls.fromAccountTypes.value;
    const filters = (this.data.transferFilters || []);
    if (fromAccount) {
      return filters.filter(f => f.accountType.id === fromAccount);
    }
    if (this.findCurrency(true)) {
      const types = this.accountTypes().map(t => t.id);
      return filters.filter(f => types.includes(f.accountType.id));
    }

    return filters;
  }

  accountTypes(): AccountType[] {
    const currency = this.findCurrency(false);
    const types = (this.data.accountTypes || []) as AccountType[];
    if (currency) {
      return types.filter(t => !t.currency || t.currency.id === currency.id);
    }
    return types;
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

  toSearchParams(value: any): TransferSearchParams {
    const query: TransferSearchParams = value;
    query.currencies = value.currency ? [value.currency] : [];
    query.datePeriod = this.bankingHelper.resolveDatePeriod(value);
    query.amountRange = ApiHelper.rangeFilter(value.minAmount, value.maxAmount);
    query.fields = [];
    if (value.chargedBack) {
      query.chargedBack = value.chargedBack === 'yes';
    }
    return query;
  }

  doSearch(query: TransferSearchParams) {
    return this.transfersService.searchTransfers$Response(query);
  }

  get kindOptions(): FieldOption[] {
    const statuses = Object.values(TransferKind) as TransferKind[];
    return statuses.map(kind => ({
      value: kind,
      text: this.apiI18n.transferKind(kind),
    }));
  }

  /**
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: TransferResult): string[] {
    return ['/banking', 'transfer', this.bankingHelper.transactionNumberOrId(row)];
  }

  get toLink() {
    return (row: TransferResult) => this.path(row);
  }

  showMoreFiltersLabel() {
    return this.i18n.general.moreFilters;
  }

  showLessFiltersLabel() {
    return this.i18n.general.lessFilters;
  }

  resolveMenu() {
    return this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR
      ? Menu.ADMIN_TRANSFERS_OVERVIEW : Menu.BROKER_TRANSFERS_OVERVIEW;
  }

}
