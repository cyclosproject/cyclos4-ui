import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { TransactionsService } from 'app/api/services';
import { BaseTransactionsSearch } from 'app/banking/transactions/base-transactions-search.component';
import { TransactionKind, RecurringPaymentStatusEnum } from 'app/api/models';
import { TransactionStatusService } from 'app/core/transaction-status.service';

/**
 * Search for recurring payments
 */
@Component({
  selector: 'search-recurring-payments',
  templateUrl: 'search-recurring-payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchRecurringPaymentsComponent
  extends BaseTransactionsSearch {

  constructor(
    injector: Injector,
    transactionsService: TransactionsService,
    transactionStatusService: TransactionStatusService
  ) {
    super(injector, transactionsService, transactionStatusService);
  }

  getInitialStatus() {
    return RecurringPaymentStatusEnum.OPEN;
  }

  getStatusesPropertyName() {
    return 'recurringPaymentStatuses';
  }

  getKinds() {
    return [TransactionKind.RECURRING_PAYMENT];
  }

  get statusOptions() {
    return RecurringPaymentStatusEnum.values().map(st => ({
      value: st,
      text: this.transactionStatusService.recurringPaymentStatus(st)
    }));
  }
}
