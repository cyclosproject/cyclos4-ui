import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransactionAuthorizationStatusEnum, TransactionKind } from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { BaseTransactionsSearch } from 'app/banking/transactions/base-transactions-search.component';
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
  extends BaseTransactionsSearch implements OnInit {

  constructor(
    injector: Injector,
    transactionsService: TransactionsService,
    transactionStatusService: TransactionStatusService
  ) {
    super(injector, transactionsService, transactionStatusService);
  }

  getKinds() {
    return [
      TransactionKind.PAYMENT, TransactionKind.ORDER,
      TransactionKind.SCHEDULED_PAYMENT, TransactionKind.RECURRING_PAYMENT
    ];
  }

  ngOnInit() {
    super.ngOnInit();
    this.form.patchValue(
      { authorizationStatuses: TransactionAuthorizationStatusEnum.PENDING },
      { emitEvent: false }
    );
  }

  get statusOptions() {
    return TransactionAuthorizationStatusEnum.values().map(st => ({
      value: st,
      text: this.transactionStatusService.authorizationStatus(st)
    }));
  }

  protected buildQuery(value: any): TransactionsService.SearchTransactionsParams {
    const query = super.buildQuery(value);
    query.authorizationStatuses = [value.status];
    return query;
  }

}
