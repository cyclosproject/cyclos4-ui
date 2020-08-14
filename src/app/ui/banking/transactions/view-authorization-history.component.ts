import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { TransactionAuthorization, TransactionView } from 'app/api/models';
import { TransactionsService } from 'app/api/services/transactions.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';

/**
 * Displays the authorization history of a transaction
 */
@Component({
  selector: 'view-authorization-history',
  templateUrl: 'view-authorization-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewAuthorizationHistoryComponent extends BaseViewPageComponent<TransactionView> implements OnInit {

  constructor(
    injector: Injector,
    private transactionsService: TransactionsService
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
      key,
      fields: [
        'transactionNumber', 'date', 'amount', 'kind', 'type',
        'from', 'to', 'authorizations'],
    })
      .subscribe(transaction => {
        this.data = transaction;
      }));
  }

  actionLabel(auth: TransactionAuthorization): string {
    return this.apiI18n.authorizationAction(auth.action);
  }

  resolveMenu(view: TransactionView) {
    return this.menu.accountMenu(view.from, view.to);
  }

}
