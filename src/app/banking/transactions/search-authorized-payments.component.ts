import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { TransactionsService } from 'app/api/services';
import { BaseTransactionsSearch } from 'app/banking/transactions/base-transactions-search.component';
import { TransactionKind, TransactionAuthorizationStatusEnum, TransactionResult } from 'app/api/models';
import { TransactionStatusService } from 'app/core/transaction-status.service';

/**
 * Search for authorized payments
 */
@Component({
  selector: 'search-authorized-payments',
  templateUrl: 'search-authorized-payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAuthorizedPaymentsComponent
  extends BaseTransactionsSearch {

  constructor(
    injector: Injector,
    transactionsService: TransactionsService,
    transactionStatusService: TransactionStatusService
  ) {
    super(injector, transactionsService, transactionStatusService);
  }

  getStatusesPropertyName() {
    return 'authorizationStatuses';
  }

  getInitialStatus() {
    return TransactionAuthorizationStatusEnum.PENDING;
  }

  getKinds() {
    return [
      TransactionKind.PAYMENT, TransactionKind.ORDER,
      TransactionKind.SCHEDULED_PAYMENT, TransactionKind.RECURRING_PAYMENT
    ];
  }

  get statusOptions() {
    return TransactionAuthorizationStatusEnum.values().map(st => ({
      value: st,
      text: this.transactionStatusService.authorizationStatus(st)
    }));
  }

  scheduling(row: TransactionResult) {
    switch (row.kind) {
      case TransactionKind.SCHEDULED_PAYMENT:
        if (row.installmentCount === 1) {
          return this.i18n('Future date');
        } else {
          return this.i18n('{{count}} installments', {
            count: row.installmentCount
          });
        }
      case TransactionKind.RECURRING_PAYMENT:
        return this.i18n('Repeat monthly');
      default:
        return this.i18n('Direct payment');
    }
  }

}
