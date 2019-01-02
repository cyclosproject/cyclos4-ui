import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransactionAuthorization, TransactionView } from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { BasePageComponent } from 'app/shared/base-page.component';
import { I18n } from '@ngx-translate/i18n-polyfill';

/**
 * Displays the authorization history of a transaction
 */
@Component({
  selector: 'view-authorization-history',
  templateUrl: 'view-authorization-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewAuthorizationHistoryComponent extends BasePageComponent<TransactionView> implements OnInit {

  constructor(
    injector: Injector,
    i18n: I18n,
    private transactionsService: TransactionsService,
    private transactionStatusService: TransactionStatusService
  ) {
    super(injector, i18n);
  }

  get transaction(): TransactionView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.transactionsService.viewTransaction({
      key: key,
      fields: ['transactionNumber', 'date', 'amount', 'authorizations']
    })
      .subscribe(transaction => {
        this.data = transaction;
      });
  }

  actionLabel(auth: TransactionAuthorization): string {
    return this.transactionStatusService.authorizationAction(auth.action);
  }
}
