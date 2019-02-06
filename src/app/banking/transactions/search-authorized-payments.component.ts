import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransactionAuthorizationStatusEnum, TransactionKind } from 'app/api/models';
import { BaseTransactionsSearch } from 'app/banking/transactions/base-transactions-search.component';
import { FieldOption } from 'app/shared/field-option';

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

  constructor(injector: Injector) {
    super(injector);
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
      { status: TransactionAuthorizationStatusEnum.PENDING },
      { emitEvent: false }
    );
  }

  get statusOptions(): FieldOption[] {
    const statuses = Object.values(TransactionAuthorizationStatusEnum) as TransactionAuthorizationStatusEnum[];
    return statuses.map(st => ({
      value: st,
      text: this.transactionStatusService.authorizationStatus(st)
    }));
  }

  protected buildQuery(value: any): any {
    const query = super.buildQuery(value);
    query.authorizationStatuses = [value.status];
    return query;
  }

}
