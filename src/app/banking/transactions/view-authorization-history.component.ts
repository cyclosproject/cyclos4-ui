import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransactionAuthorization, TransactionView } from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

/**
 * Displays the authorization history of a transaction
 */
@Component({
  selector: 'view-authorization-history',
  templateUrl: 'view-authorization-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewAuthorizationHistoryComponent extends BaseViewPageComponent<TransactionView> implements OnInit {

  constructor(
    injector: Injector,
    private transactionsService: TransactionsService,
    private transactionStatusService: TransactionStatusService,
    private bankingHelper: BankingHelperService
  ) {
    super(injector);
  }

  get transaction(): TransactionView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.addSub(this.transactionsService.viewTransaction({
      key: key,
      fields: [
        'transactionNumber', 'date', 'amount', 'kind', 'type',
        'fromKind', 'fromUser', 'toKind', 'toUser', 'authorizations']
    })
      .subscribe(transaction => {
        this.data = transaction;
      }));
  }

  actionLabel(auth: TransactionAuthorization): string {
    return this.transactionStatusService.authorizationAction(auth.action);
  }

  resolveMenu(view: TransactionView) {
    return this.authHelper.accountMenu(
      this.bankingHelper.asAccount(view, true),
      this.bankingHelper.asAccount(view, false));
  }

}
