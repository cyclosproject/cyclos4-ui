import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AccountType, Currency,
  ExternalPaymentStatusEnum,
  PaymentRequestStatusEnum, RoleEnum, TransactionAuthorizationStatusEnum, TransactionDataForSearch,
  TransactionKind, TransactionOverviewDataForSearch, TransactionOverviewQueryFilters, TransactionOverviewResult
} from 'app/api/models';
import { TransactionsService } from 'app/api/services/transactions.service';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';

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

  kind: 'authorized' | 'myAuth' | 'payment-request' | 'external-payment';
  heading: string;
  mobileHeading: string;
  usePeriod = true;
  usePreselectedPeriod = true;
  currenciesByKey = new Map<string, Currency>();
  currencies: Currency[];
  hasTransactionNumber: boolean;
  transactionNumberPattern: string;

  constructor(
    injector: Injector,
    private transactionsService: TransactionsService,
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
        break;
      case 'payment-request':
        this.heading = this.i18n.transaction.title.paymentRequestsOverview;
        this.mobileHeading = this.i18n.transaction.mobileTitle.paymentRequestsOverview;
        break;
      case 'external-payment':
        this.heading = this.i18n.transaction.title.externalPaymentsOverview;
        this.mobileHeading = this.i18n.transaction.mobileTitle.externalPaymentsOverview;
        break;
    }

    // Get the transactions search data
    this.stateManager.cache('data',
      this.transactionsService.getTransactionsOverviewDataForSearch({
        fields: ['user', 'accountTypes', ...(this.usePreselectedPeriod ? ['preselectedPeriods'] : []), 'query',
          ...(this.kind === 'authorized' ? ['authorizationRoles'] : [])],
        pendingMyAuthorization: this.kind === 'myAuth'
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
    this.currencies.forEach(c => this.currenciesByKey.set(ApiHelper.internalNameOrId(c), c));
    const transactionNumberPatterns = this.currencies
      .map(c => c.transactionNumberPattern)
      .filter(p => p)
      .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
    this.hasTransactionNumber = transactionNumberPatterns.length > 0;
    this.transactionNumberPattern = transactionNumberPatterns.length === 1 ? transactionNumberPatterns[0] : null;
    this.headingActions = this.isMyAuth ? [] : [this.moreFiltersAction];
    this.exportHelper.headingActions(data.exportFormats,
      f => this.transactionsService.exportTransactionsOverview$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      })).forEach(a => this.headingActions.push(a));
    this.addSub(this.form.controls.currency.valueChanges.subscribe(currencyId => this.updateAccountTypes(currencyId)));
  }

  updateAccountTypes(currencyId: string) {
    const selectedFrom = this.form.controls.fromAccountTypes.value;
    const selectedTo = this.form.controls.toAccountTypes.value;
    if (currencyId && selectedFrom) {
      this.form.controls.fromAccountTypes.setValue(
        this.data.accountTypes.find(at => at.id === selectedFrom).currency?.id === currencyId ? selectedFrom : null);
    }
    if (currencyId && selectedTo) {
      this.form.controls.toAccountTypes.setValue(
        this.data.accountTypes.find(at => at.id === selectedTo).currency?.id === currencyId ? selectedTo : null);
    }
  }

  doSearch(value: TransactionOverviewQueryFilters) {
    return this.transactionsService.searchTransactionsOverview$Response(value);
  }

  getFormControlNames() {
    return ['status', 'currency', 'user', 'preselectedPeriod', 'periodBegin', 'periodEnd', 'transactionNumber', 'expirationBegin',
      'expirationEnd', 'transferTypes', 'authorizationPerformedBy', 'fromAccountTypes', 'toAccountTypes', 'authorizationRoles'];
  }

  getInitialFormValue(data: TransactionDataForSearch) {
    const value = super.getInitialFormValue(data);
    switch (this.kind) {
      case 'authorized':
        value.status = TransactionAuthorizationStatusEnum.PENDING;
        break;
      case 'payment-request':
        value.status = PaymentRequestStatusEnum.OPEN;
        break;
      case 'external-payment':
        value.status = ExternalPaymentStatusEnum.PENDING;
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
          text: this.apiI18n.authorizationStatus(st),
        }));
      case 'payment-request':
        return (Object.values(PaymentRequestStatusEnum) as PaymentRequestStatusEnum[]).map(st => ({
          value: st,
          text: this.apiI18n.paymentRequestStatus(st)
        }));
      case 'external-payment':
        return (Object.values(ExternalPaymentStatusEnum) as ExternalPaymentStatusEnum[]).map(st => ({
          value: st,
          text: this.apiI18n.externalPaymentStatus(st)
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
    if (this.isPaymentRequest()) {
      params.paymentRequestExpiration = ApiHelper.dateRangeFilter(value.expirationBegin, value.expirationEnd);
    } else if (this.isExternalPayment()) {
      params.externalPaymentExpiration = ApiHelper.dateRangeFilter(value.expirationBegin, value.expirationEnd);
    }
    switch (this.kind) {
      case 'authorized':
        params.authorizationStatuses = [value.status];
        params.authorized = true;
        break;
      case 'myAuth':
        params.pendingMyAuthorization = true;
        break;
      case 'payment-request':
        params.paymentRequestStatuses = [value.status];
        params.kinds = [TransactionKind.PAYMENT_REQUEST];
        break;
      case 'external-payment':
        params.externalPaymentStatuses = [value.status];
        params.kinds = [TransactionKind.EXTERNAL_PAYMENT];
        break;
    }
    return params;
  }

  accountTypes(): AccountType[] {
    const currencyId = this.form.controls.currency.value;
    const types = (this.data.accountTypes || []) as AccountType[];
    if (currencyId) {
      return types.filter(t => t.currency.id === currencyId);
    }
    return types;
  }

  isPaymentRequest(): boolean {
    return this.kind === 'payment-request';
  }

  isExternalPayment(): boolean {
    return this.kind === 'external-payment';
  }

  isMyAuth(): boolean {
    return this.kind === 'myAuth';
  }

  isAuthorized(): boolean {
    return this.kind === 'authorized';
  }

  showMoreFiltersLabel() {
    return this.i18n.general.moreFilters;
  }

  showLessFiltersLabel() {
    return this.i18n.general.lessFilters;
  }

  resolveMenu(data: TransactionDataForSearch) {
    let menu: Menu;
    switch (this.kind) {
      case 'authorized':
        if (this.dataForFrontendHolder.role === RoleEnum.BROKER) {
          menu = Menu.BROKER_AUTHORIZED_PAYMENTS_OVERVIEW;
        } else {
          menu = Menu.AUTHORIZED_PAYMENTS_OVERVIEW;
        }
        break;
      case 'myAuth':
        menu = Menu.PENDING_MY_AUTHORIZATION;
        break;
      case 'payment-request':
        menu = Menu.PAYMENT_REQUESTS_OVERVIEW;
        break;
      case 'external-payment':
        menu = Menu.EXTERNAL_PAYMENTS_OVERVIEW;
        break;
    }
    return this.menu.userMenu(data.user, menu);
  }

  get toLink() {
    return (row: TransactionOverviewResult) => this.bankingHelper.transactionPath(row);
  }
}
