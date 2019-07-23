import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { RecurringPaymentStatusEnum, ScheduledPaymentStatusEnum, TransactionDataForSearch, TransactionKind } from 'app/api/models';
import { BaseTransactionsSearch, TransactionSearchParams } from 'app/banking/transactions/base-transactions-search.component';
import { Menu } from 'app/shared/menu';

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
    if (!this.form.value.status) {
      this.form.patchValue(
        { status: ScheduledPaymentStatusEnum.OPEN },
        { emitEvent: false }
      );
    }
  }

  getKinds() {
    return [TransactionKind.SCHEDULED_PAYMENT, TransactionKind.RECURRING_PAYMENT];
  }

  get statusOptions() {
    const statuses = Object.values(ScheduledPaymentStatusEnum) as ScheduledPaymentStatusEnum[];
    return statuses.map(st => ({
      value: st,
      text: this.transactionStatusService.scheduledPaymentStatus(st)
    }));
  }

  protected toSearchParams(value: any): TransactionSearchParams {
    const query = super.toSearchParams(value);
    const status = value.status as ScheduledPaymentStatusEnum;
    query.scheduledPaymentStatuses = [status];
    const recurringStatuses = Object.values(RecurringPaymentStatusEnum);
    const recurringStatus = recurringStatuses.includes(value.status) ? value.status as RecurringPaymentStatusEnum : null;
    if (recurringStatus) {
      query.recurringPaymentStatuses = [recurringStatus];
    } else {
      // The scheduled payments statuses is a superset of the recurring payment statuses.
      // When selecting a status that is not available as recurring, set the kind to be only scheduled.
      query.kinds = [TransactionKind.SCHEDULED_PAYMENT];
    }
    return query;
  }

  resolveMenu(data: TransactionDataForSearch) {
    return this.authHelper.userMenu(data.user, Menu.SCHEDULED_PAYMENTS);
  }

}
