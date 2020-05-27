import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  Currency, TransactionAuthorizationStatusEnum, TransactionDataForSearch,
  TransactionOverviewDataForSearch, TransactionOverviewQueryFilters, TransactionOverviewResult, RoleEnum
} from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { Menu } from 'app/shared/menu';

/**
 * Search for transactions overview
 */
@Component({
  selector: 'search-transactions-overview',
  templateUrl: 'search-transactions-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTransactionsOverviewComponent
  extends BaseSearchPageComponent<TransactionOverviewDataForSearch, TransactionOverviewQueryFilters, TransactionOverviewResult>
  implements OnInit {

  kind: 'authorized' | 'myAuth';
  heading: string;
  mobileHeading: string;
  usePeriod = true;
  currenciesByKey = new Map<string, Currency>();
  currencies: Currency[];

  constructor(
    injector: Injector,
    private transactionsService: TransactionsService,
    public transactionStatusService: TransactionStatusService,
    public bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.kind = route.data.kind;

    switch (this.kind) {
      case 'authorized':
        this.heading = this.i18n.transaction.title.authorizations;
        this.mobileHeading = this.i18n.transaction.mobileTitle.authorizations;
        break;
      case 'myAuth':
        this.heading = this.i18n.transaction.title.pendingMyAuthorization;
        this.mobileHeading = this.i18n.transaction.mobileTitle.pendingMyAuthorization;
        this.usePeriod = false;
        break;
    }

    // Get the transactions search data
    this.stateManager.cache('data',
      this.transactionsService.getTransactionsOverviewDataForSearch({
        fields: ['user', 'accountTypes', ...(this.usePeriod ? ['preselectedPeriods'] : []), 'query'],
      }),
    ).subscribe(data => {
      if (this.usePeriod) {
        this.bankingHelper.preProcessPreselectedPeriods(data, this.form);
      }
      this.data = data;
    });
  }

  onDataInitialized(data: TransactionOverviewDataForSearch) {
    super.onDataInitialized(data);
    this.currencies = [...new Set(data.accountTypes.map(at => at.currency))];
    this.currencies.sort((c1, c2) => c1.name.localeCompare(c2.name));
    this.currenciesByKey = new Map();
    this.currencies.forEach(c => this.currenciesByKey.set(c.id, c));
    this.headingActions = this.exportHelper.headingActions(data.exportFormats,
      f => this.transactionsService.exportTransactionsOverview$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      }));
  }

  doSearch(value: TransactionOverviewQueryFilters) {
    return this.transactionsService.searchTransactionsOverview$Response(value);
  }

  getFormControlNames() {
    return ['status', 'currency', 'user', 'preselectedPeriod', 'periodBegin', 'periodEnd'];
  }

  getInitialFormValue(data: TransactionDataForSearch) {
    const value = super.getInitialFormValue(data);
    switch (this.kind) {
      case 'authorized':
        value.status = TransactionAuthorizationStatusEnum.PENDING;
        break;
    }
    return value;
  }

  get statusOptions(): FieldOption[] {
    switch (this.kind) {
      case 'authorized':
        const statuses = Object.values(TransactionAuthorizationStatusEnum) as TransactionAuthorizationStatusEnum[];
        return statuses.map(st => ({
          value: st,
          text: this.transactionStatusService.authorizationStatus(st),
        }));
      case 'myAuth':
        // Isn't filtered by status
        return null;
    }
  }

  protected toSearchParams(value: any): TransactionOverviewQueryFilters {
    const params: TransactionOverviewQueryFilters = value;
    params.currencies = value.currency ? [value.currency] : [];
    if (this.usePeriod) {
      params.datePeriod = this.bankingHelper.resolveDatePeriod(value);
    }
    switch (this.kind) {
      case 'authorized':
        params.authorizationStatuses = [value.status];
        params.authorized = true;
        break;
      case 'myAuth':
        params.pendingMyAuthorization = true;
        break;
    }
    return params;
  }

  resolveMenu(data: TransactionDataForSearch) {
    let menu: Menu;
    switch (this.kind) {
      case 'authorized':
        if (this.dataForUiHolder.role === RoleEnum.BROKER) {
          menu = Menu.BROKER_AUTHORIZED_PAYMENTS_OVERVIEW;
        } else {
          menu = Menu.AUTHORIZED_PAYMENTS_OVERVIEW;
        }
        break;
      case 'myAuth':
        menu = Menu.PENDING_MY_AUTHORIZATION;
        break;
    }
    return this.authHelper.userMenu(data.user, menu);
  }

  get toLink() {
    return (row: TransactionOverviewResult) => this.bankingHelper.transactionPath(row);
  }
}
