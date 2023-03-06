import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Currency, CustomFieldDetailed, InstallmentDataForSearch, InstallmentResult, InstallmentStatusEnum, TransactionDataForSearch } from 'app/api/models';
import { InstallmentQueryFilters } from 'app/api/models/installment-query-filters';
import { InstallmentsService } from 'app/api/services/installments.service';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

export type InstallmentSearchParams = InstallmentQueryFilters & {
  owner: string;
};

/**
 * Search for installments from the point of view of a given owner
 */
@Component({
  selector: 'search-owner-installments',
  templateUrl: 'search-owner-installments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchOwnerInstallmentsComponent
  extends BaseSearchPageComponent<InstallmentDataForSearch, InstallmentSearchParams, InstallmentResult>
  implements OnInit {

  param: string;
  self: boolean;
  currencies = new Map<string, Currency>();
  hasTransactionNumber: boolean;
  transactionNumberPattern: string;
  fieldsInSearch: CustomFieldDetailed[];
  fieldsInList: CustomFieldDetailed[];

  constructor(
    injector: Injector,
    private installmentsService: InstallmentsService,
    public bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.param = route.params.owner;
    this.self = this.authHelper.isSelf(this.param);

    // Get the installments search data
    this.stateManager.cache('data', this.installmentsService.getInstallmentsDataForSearch({
      owner: this.param,
      fields: ['user', 'accountTypes', 'query', 'fieldsInBasicSearch', 'fieldsInList', 'customFields', 'archivingDate']
    })).subscribe(data => this.data = data);
  }

  prepareForm(data: InstallmentDataForSearch) {
    this.fieldsInSearch = data.customFields.filter(cf => data.fieldsInBasicSearch.includes(cf.internalName));
    this.fieldsInList = data.customFields.filter(cf => data.fieldsInList.includes(cf.internalName));
    this.form.setControl('customFields', this.fieldHelper.customFieldsForSearchFormGroup(this.fieldsInSearch, data.query.customFields));
  }

  onDataInitialized(data: InstallmentDataForSearch) {
    super.onDataInitialized(data);
    // Initialize the currencies Map to make lookups easier
    (data.accountTypes || []).forEach(at => {
      const currency = at.currency;
      this.currencies.set(currency.id, currency);
      if (!empty(currency.internalName)) {
        this.currencies.set(currency.internalName, currency);
      }
    });
    const transactionNumberPatterns = (data.accountTypes || [])
      .map(a => a.currency?.transactionNumberPattern)
      .filter(p => p)
      .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
    this.hasTransactionNumber = transactionNumberPatterns.length > 0;
    this.transactionNumberPattern = transactionNumberPatterns.length === 1 ? transactionNumberPatterns[0] : null;
    this.headingActions = [this.moreFiltersAction];
  }

  getFormControlNames() {
    return ['status', 'accountType', 'transferFilter', 'user', 'periodBegin', 'periodEnd', 'direction', 'transactionNumber',
      'customFields', 'orderBy'];
  }

  getInitialFormValue(data: TransactionDataForSearch) {
    const value = super.getInitialFormValue(data);
    value.status = InstallmentStatusEnum.SCHEDULED;
    return value;
  }

  get statusOptions() {
    const statuses = Object.values(InstallmentStatusEnum) as InstallmentStatusEnum[];
    return statuses.map(st => ({
      value: st,
      text: this.apiI18n.installmentStatus(st),
    }));
  }

  protected toSearchParams(value: any): InstallmentSearchParams {
    const params: InstallmentSearchParams = value;
    params.owner = this.param;
    params.accountTypes = value.accountType ? [value.accountType] : null;
    params.transferFilters = value.transferFilter ? [value.transferFilter] : null;
    params.datePeriod = this.bankingHelper.resolveDatePeriod(value);
    const status = value.status as InstallmentStatusEnum;
    params.statuses = [status];
    params.customFields = this.fieldHelper.toCustomValuesFilter(value.customFields);
    return params;
  }

  showMoreFiltersLabel() {
    return this.i18n.general.moreFilters;
  }

  showLessFiltersLabel() {
    return this.i18n.general.lessFilters;
  }

  resolveMenu(data: TransactionDataForSearch) {
    return this.menu.userMenu(data.user, Menu.SCHEDULED_PAYMENTS);
  }

  protected doSearch(filter: InstallmentSearchParams): Observable<HttpResponse<InstallmentResult[]>> {
    return this.installmentsService.searchInstallments$Response(filter);
  }

  get toLink() {
    return (row: InstallmentResult) => this.bankingHelper.transactionPath(row.transaction);
  }

  number(row: InstallmentResult): string {
    if (row.totalInstallments) {
      return this.i18n.transaction.installmentNumberOfTotal({
        number: row.number, total: row.totalInstallments
      });
    }
    return String(row.number);
  }
}
