import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { PerformPaymentComponent } from 'app/banking/payments/perform-payment.component';
import { Menu } from 'app/shared/menu';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';

const bankingRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedUserGuard],
    children: [
      {
        path: 'account',
        component: AccountHistoryComponent,
        data: {
          menu: Menu.ACCOUNT_HISTORY
        }
      },
      {
        path: 'account/:type',
        component: AccountHistoryComponent,
        data: {
          menu: Menu.ACCOUNT_HISTORY
        }
      },
      {
        path: 'transfer/:key',
        component: ViewTransferComponent,
        data: {
          menu: Menu.VIEW_TRANSFER
        }
      },
      {
        path: 'transaction/:key',
        component: ViewTransactionComponent,
        data: {
          menu: Menu.VIEW_TRANSACTION
        }
      },
      {
        path: 'payment',
        component: PerformPaymentComponent,
        data: {
          menu: Menu.PERFORM_PAYMENT
        }
      }
    ]
  }
];

/**
 * Routes for the banking module
 */
@NgModule({
  imports: [
    RouterModule.forChild(bankingRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class BankingRoutingModule { }
