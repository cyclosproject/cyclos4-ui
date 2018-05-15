import { Component, Injector, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TransactionsService } from 'app/api/services/transactions.service';
import { BaseComponent } from 'app/shared/base.component';
import { TransactionView } from 'app/api/models/transaction-view';
import { TransactionKind } from 'app/api/models/transaction-kind';

/**
 * Component that shows details of a transaction
 */
@Component({
  selector: 'view-transaction',
  templateUrl: './view-transaction.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransactionComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private transactionsService: TransactionsService
  ) {
    super(injector);
  }

  loaded = new BehaviorSubject<boolean>(false);

  transaction: TransactionView;

  get title(): string {
    const kind = (this.transaction || {}).kind;
    switch (kind) {
      case TransactionKind.PAYMENT:
        return this.messages.transactionViewPaymentTitle();
      case TransactionKind.SCHEDULED_PAYMENT:
        return this.messages.transactionViewScheduledPaymentTitle();
      case TransactionKind.RECURRING_PAYMENT:
        return this.messages.transactionViewRecurringPaymentTitle();
      default:
        return this.messages.transactionViewTitle();
    }
  }

  ngOnInit() {
    const key = this.route.snapshot.paramMap.get('key');
    this.transactionsService.viewTransaction({ key: key })
      .subscribe(transaction => {
        this.transaction = transaction;
        this.loaded.next(true);
      });
  }
}
