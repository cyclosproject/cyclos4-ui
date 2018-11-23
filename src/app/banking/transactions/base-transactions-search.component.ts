import { Injector, OnInit } from '@angular/core';
import { Currency, Image, TransactionDataForSearch, TransactionKind, TransactionResult, TransferFilter } from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';

/**
 * Base implementation for pages that search for transaction
 */
export abstract class BaseTransactionsSearch
  extends BaseSearchPageComponent<TransactionDataForSearch, TransactionResult>
  implements OnInit {

  transferFilters$ = new BehaviorSubject<TransferFilter[]>([]);
  currencies = new Map<string, Currency>();

  constructor(
    injector: Injector,
    protected transactionsService: TransactionsService,
    protected transactionStatusService: TransactionStatusService
  ) {
    super(injector);
  }

  getFormControlNames() {
    return ['status', 'accountType', 'transferFilter', 'preselectedPeriod', 'periodBegin', 'periodEnd'];
  }

  ngOnInit() {
    super.ngOnInit();

    // Get the account history data
    this.stateManager.cache('data',
      this.transactionsService.getTransactionsDataForSearch({
        owner: ApiHelper.SELF,
        fields: ['accountTypes', 'transferFilters', 'preselectedPeriods', 'query']
      })
    ).subscribe(data => {
      ApiHelper.preProcessPreselectedPeriods(data, this.form);

      // Initialize the currencies Map to make lookups easier
      (data.accountTypes || []).forEach(at => {
        const currency = at.currency;
        this.currencies.set(currency.id, currency);
        if (!empty(currency.internalName)) {
          this.currencies.set(currency.internalName, currency);
        }
      });

      // Initialize the query statuses
      this.form.patchValue({ 'status': this.getInitialStatus() }, { emitEvent: false });

      // Only initialize the data once the form is filled-in
      this.data = data;
    });

    // Whenever the account type changes, also update the transfer filters
    this.addSub(this.form.get('accountType').valueChanges.subscribe(at => {
      this.form.patchValue({ transferFilter: null }, { emitEvent: false });
      const filters = this.data.transferFilters.filter(tf => tf.accountType.id === at);
      this.transferFilters$.next(filters);
    }));

    this.printable = true;
    this.headingActions = [this.printAction];
  }

  /**
   * Must be implemented to return the initial status value
   */
  protected abstract getInitialStatus(): string;

  /**
   * Must be implemented to return the actual property name on the statuses filter
   */
  protected abstract getStatusesPropertyName(): string;

  /**
   * Must be implemented to return the actual kinds of transactions to be returned
   */
  protected abstract getKinds(): TransactionKind[];

  doSearch(value) {
    const query: any = {
      page: value.page, pageSize: value.pageSize,
      owner: ApiHelper.SELF,
      accountTypes: value.accountType ? [value.accountType] : null,
      transferFilters: value.transferFilter ? [value.transferFilter] : null,
      datePeriod: ApiHelper.resolveDatePeriod(value)
    };
    const statusesProperty = this.getStatusesPropertyName();
    const kinds = this.getKinds();
    if (!empty(statusesProperty)) {
      query[statusesProperty] = [value.status];
    }
    query.kinds = kinds;
    return this.transactionsService.searchTransactionsResponse(query);
  }

  /**
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: TransactionResult): string[] {
    return ['/banking', 'transaction', ApiHelper.transactionNumberOrId(row)];
  }

  /**
   * Returns the icon used on the given row's avatar
   * @param row The row
   */
  avatarIcon(row: TransactionResult): string {
    return row.relatedKind === 'user' ? 'account_circle' : 'account_balance_circle';
  }

  /**
   * Returns the image used on the given row's avatar
   * @param row The row
   */
  avatarImage(row: TransactionResult): Image {
    return (row.relatedUser || {}).image;
  }

  /**
   * Returns wither the user display or 'System'
   * @param row The row
   */
  subjectName(row: TransactionResult): string {
    if (row.relatedKind === 'system') {
      return this.i18n('System');
    } else {
      return (row.relatedUser || {}).display;
    }
  }

  /**
   * Returns the status name
   * @param row The transaction
   */
  status(row: TransactionResult): string {
    return this.transactionStatusService.transactionStatus(row);
  }
}
