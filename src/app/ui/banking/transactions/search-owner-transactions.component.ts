import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  Currency,
  PaymentRequestStatusEnum, TransactionAuthorizationStatusEnum, TransactionDataForSearch,
  TransactionKind, TransactionQueryFilters, TransactionResult, TransferFilter
} from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type TransactionSearchParams = TransactionQueryFilters & {
  owner: string;
};

/**
 * Search for transactions of a specific owner
 */
@Component({
  selector: 'search-owner-transactions',
  templateUrl: 'search-owner-transactions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchOwnerTransactionsComponent
  extends BaseSearchPageComponent<TransactionDataForSearch, TransactionSearchParams, TransactionResult>
  implements OnInit {

  kind: 'authorized' | 'payment-request';
  param: string;
  self: boolean;
  heading: string;
  mobileHeading: string;
  transferFilters$ = new BehaviorSubject<TransferFilter[]>([]);
  currencies = new Map<string, Currency>();
  hasTransactionNumber: boolean;
  usePreselectedPeriods = false;
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
    this.param = route.params.owner;
    this.self = this.authHelper.isSelf(this.param);

    switch (this.kind) {
      case 'authorized':
        this.heading = this.i18n.transaction.title.authorizations;
        this.mobileHeading = this.i18n.transaction.mobileTitle.authorizations;
        this.usePreselectedPeriods = true;
        break;
      case 'payment-request':
        this.heading = this.i18n.transaction.title.paymentRequests;
        this.mobileHeading = this.i18n.transaction.mobileTitle.paymentRequests;
        break;
    }

    // Get the transactions search data
    this.stateManager.cache('data',
      this.transactionsService.getTransactionsDataForSearch({
        owner: this.param,
        fields: ['user', 'accountTypes', 'visibleKinds', 'transferFilters', ...(this.usePreselectedPeriods ? ['preselectedPeriods'] : []), 'query'],
      }),
    ).subscribe(data => {
      this.bankingHelper.preProcessPreselectedPeriods(data, this.form);

      // Initialize the currencies Map to make lookups easier
      (data.accountTypes || []).forEach(at => {
        const currency = at.currency;
        this.currencies.set(currency.id, currency);
        if (!empty(currency.internalName)) {
          this.currencies.set(currency.internalName, currency);
        }
      });

      // Only initialize the data once the form is filled-in
      this.data = data;
    });

    // Whenever the account type changes, also update the transfer filters
    this.addSub(this.form.get('accountType').valueChanges.subscribe(at => {
      this.form.patchValue({ transferFilter: null }, { emitEvent: false });
      const filters = this.data.transferFilters.filter(tf => tf.accountType.id === at);
      this.transferFilters$.next(filters);
    }));
  }

  onDataInitialized(data: TransactionDataForSearch) {
    super.onDataInitialized(data);
    const transactionNumberPatterns = Array.from(this.currencies.values())
      .map(c => c.transactionNumberPattern)
      .filter(p => p)
      .reduce((unique, item) => unique.includes(item) ? unique : [...unique, item], []);
    this.hasTransactionNumber = transactionNumberPatterns.length > 0;
    this.transactionNumberPattern = transactionNumberPatterns.length === 1 ? transactionNumberPatterns[0] : null;
    this.headingActions = this.exportHelper.headingActions(data.exportFormats,
      f => this.transactionsService.exportTransactions$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      }));
  }

  isPaymentRequest(): boolean {
    return this.kind === 'payment-request';
  }

  doSearch(value: TransactionSearchParams) {
    return this.transactionsService.searchTransactions$Response(value);
  }

  getFormControlNames() {
    return ['status', 'accountType', 'transferFilter', 'user', 'preselectedPeriod', 'periodBegin', 'periodEnd', 'direction',
      'transactionNumber'];
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
    }
    return value;
  }

  get statusOptions(): FieldOption[] {
    switch (this.kind) {
      case 'authorized':
        return (Object.values(TransactionAuthorizationStatusEnum) as TransactionAuthorizationStatusEnum[]).map(st => ({
          value: st,
          text: this.apiI18n.authorizationStatus(st)
        }));
      case 'payment-request':
        return (Object.values(PaymentRequestStatusEnum) as PaymentRequestStatusEnum[]).map(st => ({
          value: st,
          text: this.apiI18n.paymentRequestStatus(st)
        }));
    }
  }

  protected toSearchParams(value: any): TransactionSearchParams {
    const params: TransactionSearchParams = value;
    params.owner = this.param;
    params.accountTypes = value.accountType ? [value.accountType] : null;
    params.transferFilters = value.transferFilter ? [value.transferFilter] : null;
    params.datePeriod = this.bankingHelper.resolveDatePeriod(value);

    switch (this.kind) {
      case 'authorized':
        params.authorizationStatuses = [value.status];
        params.authorized = true;
        break;
      case 'payment-request':
        params.paymentRequestStatuses = [value.status];
        params.kinds = [TransactionKind.PAYMENT_REQUEST];
        break;
    }

    return params;
  }

  resolveMenu(data: TransactionDataForSearch) {
    let menu: Menu;
    switch (this.kind) {
      case 'authorized':
        menu = Menu.AUTHORIZED_PAYMENTS;
        break;
      case 'payment-request':
        menu = Menu.PAYMENT_REQUESTS;
        break;
    }
    return this.menu.userMenu(data.user, menu);
  }

  get toLink() {
    return (row: TransactionResult) => this.bankingHelper.transactionPath(row);
  }
}
