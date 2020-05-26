import { Directive, Injector, OnInit } from '@angular/core';
import {
  Currency, TransactionDataForSearch, TransactionKind,
  TransactionQueryFilters, TransactionResult, TransferFilter
} from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

export type TransactionSearchParams = TransactionQueryFilters & {
  owner: string;
};

/**
 * Base implementation for pages that search for transaction
 */
@Directive()
export abstract class BaseTransactionsSearch
  extends BaseSearchPageComponent<TransactionDataForSearch, TransactionSearchParams, TransactionResult>
  implements OnInit {

  param: string;
  self: boolean;
  transferFilters$ = new BehaviorSubject<TransferFilter[]>([]);
  currencies = new Map<string, Currency>();

  protected transactionsService: TransactionsService;
  public transactionStatusService: TransactionStatusService;
  public bankingHelper: BankingHelperService;

  constructor(injector: Injector) {
    super(injector);
    this.transactionsService = injector.get(TransactionsService);
    this.transactionStatusService = injector.get(TransactionStatusService);
    this.bankingHelper = injector.get(BankingHelperService);
  }

  getFormControlNames() {
    return ['status', 'accountType', 'transferFilter', 'user', 'preselectedPeriod', 'periodBegin', 'periodEnd'];
  }

  ngOnInit() {
    super.ngOnInit();
    const route = this.route.snapshot;
    this.param = route.params.owner;
    this.self = this.authHelper.isSelf(this.param);

    // Get the transactions search data
    this.stateManager.cache('data',
      this.transactionsService.getTransactionsDataForSearch({
        owner: this.param,
        fields: ['user', 'accountTypes', 'visibleKinds', 'transferFilters', 'preselectedPeriods', 'query'],
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
    this.headingActions = this.exportHelper.headingActions(data.exportFormats,
      f => this.transactionsService.exportTransactions$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      }));
  }

  /**
   * Must be implemented to return the actual kinds of transactions to be returned
   */
  protected abstract getKinds(): TransactionKind[];

  doSearch(value: TransactionSearchParams) {
    return this.transactionsService.searchTransactions$Response(value);
  }

  protected toSearchParams(value: any): TransactionSearchParams {
    const params: TransactionSearchParams = value;
    params.owner = this.param;
    params.accountTypes = value.accountType ? [value.accountType] : null;
    params.transferFilters = value.transferFilter ? [value.transferFilter] : null;
    params.datePeriod = this.bankingHelper.resolveDatePeriod(value);
    params.kinds = this.getKinds().filter(k => this.data.visibleKinds.includes(k));
    return params;
  }

  get toLink() {
    return (row: TransactionResult) => this.bankingHelper.transactionPath(row);
  }

}
