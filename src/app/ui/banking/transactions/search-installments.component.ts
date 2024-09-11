import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  Currency,
  CustomFieldDetailed,
  InstallmentOverviewDataForSearch,
  InstallmentOverviewQueryFilters,
  InstallmentOverviewResult,
  InstallmentStatusEnum,
  TransactionDataForSearch
} from 'app/api/models';
import { InstallmentsService } from 'app/api/services/installments.service';
import { empty } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

/**
 * General search for installments
 */
@Component({
  selector: 'search-installments',
  templateUrl: 'search-installments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchInstallmentsComponent
  extends BaseSearchPageComponent<
    InstallmentOverviewDataForSearch,
    InstallmentOverviewQueryFilters,
    InstallmentOverviewResult
  >
  implements OnInit
{
  currencies = new Map<string, Currency>();
  hasTransactionNumber: boolean;
  transactionNumberPattern: string;
  fieldsInSearch: CustomFieldDetailed[];
  fieldsInList: CustomFieldDetailed[];

  constructor(
    injector: Injector,
    private installmentsService: InstallmentsService,
    public bankingHelper: BankingHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Get the installments search data
    this.stateManager
      .cache(
        'data',
        this.installmentsService.getInstallmentsOverviewDataForSearch({
          fields: [
            'accountTypes',
            'preselectedPeriods',
            'query',
            'fieldsInBasicSearch',
            'fieldsInList',
            'customFields',
            'archivingDate'
          ]
        })
      )
      .subscribe(data => (this.data = data));
  }

  prepareForm(data: InstallmentOverviewDataForSearch) {
    this.fieldsInSearch = data.customFields.filter(cf => data.fieldsInBasicSearch.includes(cf.internalName));
    this.fieldsInList = data.customFields.filter(cf => data.fieldsInList.includes(cf.internalName));
    this.form.setControl(
      'customFields',
      this.fieldHelper.customFieldsForSearchFormGroup(this.fieldsInSearch, data.query.customFields)
    );
  }

  onDataInitialized(data: InstallmentOverviewDataForSearch) {
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
      .reduce((unique, item) => (unique.includes(item) ? unique : [...unique, item]), []);
    this.hasTransactionNumber = transactionNumberPatterns.length > 0;
    this.transactionNumberPattern = transactionNumberPatterns.length === 1 ? transactionNumberPatterns[0] : null;
    this.headingActions = [this.moreFiltersAction];
  }

  getFormControlNames() {
    return [
      'status',
      'fromAccountTypes',
      'toAccountTypes',
      'transferFilter',
      'user',
      'preselectedPeriod',
      'periodBegin',
      'periodEnd',
      'direction',
      'transactionNumber',
      'customFields',
      'orderBy'
    ];
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
      text: this.apiI18n.installmentStatus(st)
    }));
  }

  protected toSearchParams(value: any): InstallmentOverviewQueryFilters {
    const params: InstallmentOverviewQueryFilters = value;
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

  resolveMenu() {
    return Menu.ADMIN_SCHEDULED_PAYMENTS_OVERVIEW;
  }

  protected doSearch(filter: InstallmentOverviewQueryFilters): Observable<HttpResponse<InstallmentOverviewResult[]>> {
    return this.installmentsService.searchInstallmentsOverview$Response(filter);
  }

  get toLink() {
    return (row: InstallmentOverviewResult) => this.bankingHelper.transactionPath(row.transaction);
  }

  number(row: InstallmentOverviewResult): string {
    if (row.totalInstallments) {
      return this.i18n.transaction.installmentNumberOfTotal({
        number: row.number,
        total: row.totalInstallments
      });
    }
    return String(row.number);
  }
}
