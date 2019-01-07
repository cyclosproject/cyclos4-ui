import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { RecurringPaymentStatusEnum, ScheduledPaymentStatusEnum, TransactionKind } from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { BaseTransactionsSearch } from 'app/banking/transactions/base-transactions-search.component';

/**
 * Search for scheduled payments
 */
@Component({
  selector: 'search-scheduled-payments',
  templateUrl: 'search-scheduled-payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchScheduledPaymentsComponent
  extends BaseTransactionsSearch implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form.patchValue(
      { status: ScheduledPaymentStatusEnum.OPEN },
      { emitEvent: false }
    );
  }

  getKinds() {
    return [TransactionKind.SCHEDULED_PAYMENT, TransactionKind.RECURRING_PAYMENT];
  }

  get statusOptions() {
    return ScheduledPaymentStatusEnum.values().map(st => ({
      value: st,
      text: this.transactionStatusService.scheduledPaymentStatus(st)
    }));
  }

  protected buildQuery(value: any): TransactionsService.SearchTransactionsParams {
    const query = super.buildQuery(value);
    const status = value.status as ScheduledPaymentStatusEnum;
    query.scheduledPaymentStatuses = [status];
    const recurringStatus = RecurringPaymentStatusEnum.values().includes(value.status) ? value.status as RecurringPaymentStatusEnum : null;
    if (recurringStatus) {
      query.recurringPaymentStatuses = [recurringStatus];
    } else {
      // The scheduled payments statuses is a superset of the recurring payment statuses.
      // When selecting a status that is not available as recurring, set the kind to be only scheduled.
      query.kinds = [TransactionKind.SCHEDULED_PAYMENT];
    }
    return query;
  }

}
