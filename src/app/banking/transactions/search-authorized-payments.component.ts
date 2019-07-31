import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransactionAuthorizationStatusEnum, TransactionDataForSearch, TransactionKind } from 'app/api/models';
import { BaseTransactionsSearch, TransactionSearchParams } from 'app/banking/transactions/base-transactions-search.component';
import { FieldOption } from 'app/shared/field-option';
import { Menu } from 'app/shared/menu';

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
    if (!this.form.value.status) {
      this.form.patchValue(
        { status: TransactionAuthorizationStatusEnum.PENDING },
        { emitEvent: false }
      );
    }
  }

  get statusOptions(): FieldOption[] {
    const statuses = Object.values(TransactionAuthorizationStatusEnum) as TransactionAuthorizationStatusEnum[];
    return statuses.map(st => ({
      value: st,
      text: this.transactionStatusService.authorizationStatus(st)
    }));
  }

  protected toSearchParams(value: any): TransactionSearchParams {
    const query = super.toSearchParams(value);
    query.authorizationStatuses = [value.status];
    query.authorized = true;
    return query;
  }

  resolveMenu(data: TransactionDataForSearch) {
    return this.authHelper.userMenu(data.user, Menu.AUTHORIZED_PAYMENTS);
  }

}
