import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TransactionsService } from 'app/api/services/transactions.service';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { TransactionView } from 'app/api/models/transaction-view';
import { ApiHelper } from 'app/shared/api-helper';
import { TransactionKind } from 'app/api/models/transaction-kind';

/**
 * Component that shows details of a transaction
 */
@Component({
  selector: 'view-transaction',
  templateUrl: './view-transaction.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransactionComponent extends BaseBankingComponent {
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
        return this.bankingMessages.transactionViewPaymentTitle();
      case TransactionKind.SCHEDULED_PAYMENT:
        return this.bankingMessages.transactionViewScheduledPaymentTitle();
      case TransactionKind.RECURRING_PAYMENT:
        return this.bankingMessages.transactionViewRecurringPaymentTitle();
      default:
        return this.bankingMessages.transactionViewTitle();
    }
  }

  get from(): string {
    return ApiHelper.accountName(this.generalMessages, true, this.transaction);
  }

  get to(): string {
    return ApiHelper.accountName(this.generalMessages, false, this.transaction);
  }

  ngOnInit() {
    const key = this.route.snapshot.paramMap.get('key');
    this.transactionsService.viewTransaction({key: key})
      .subscribe(transaction => {
        this.transaction = transaction;
        this.loaded.next(true);
      });
  }
}
