import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { ScheduledPaymentStatusEnum, TransactionKind } from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { BaseTransactionsSearch } from 'app/banking/transactions/base-transactions-search.component';
import { TransactionStatusService } from 'app/core/transaction-status.service';

/**
 * Search for scheduled payments
 */
@Component({
  selector: 'search-scheduled-payments',
  templateUrl: 'search-scheduled-payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchScheduledPaymentsComponent
  extends BaseTransactionsSearch {

  constructor(
    injector: Injector,
    transactionsService: TransactionsService,
    transactionStatusService: TransactionStatusService
  ) {
    super(injector, transactionsService, transactionStatusService);
  }

  getStatusesPropertyName() {
    return 'scheduledPaymentStatuses';
  }

  getInitialStatus() {
    return ScheduledPaymentStatusEnum.OPEN;
  }

  getKinds() {
    return [TransactionKind.SCHEDULED_PAYMENT];
  }

  get statusOptions() {
    return ScheduledPaymentStatusEnum.values().map(st => ({
      value: st,
      text: this.transactionStatusService.scheduledPaymentStatus(st)
    }));
  }
}
