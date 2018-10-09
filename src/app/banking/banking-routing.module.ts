import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { Menu } from 'app/shared/menu';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { PerformPaymentComponent } from 'app/banking/payment/perform-payment.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { SearchScheduledPaymentsComponent } from 'app/banking/transactions/search-scheduled-payments.component';
import { SearchRecurringPaymentsComponent } from 'app/banking/transactions/search-recurring-payments.component';
import { SearchAuthorizedPaymentsComponent } from 'app/banking/transactions/search-authorized-payments.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';

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
        path: 'transaction/:key/authorization-history',
        component: ViewAuthorizationHistoryComponent,
        data: {
          menu: Menu.VIEW_TRANSACTION
        }
      },
      {
        path: 'payment',
        component: PerformPaymentComponent,
        data: {
          menu: Menu.PAYMENT_TO_USER
        }
      },
      {
        path: 'payment/system',
        component: PerformPaymentComponent,
        data: {
          menu: Menu.PAYMENT_TO_SYSTEM
        }
      },
      {
        path: 'payment/:to',
        component: PerformPaymentComponent,
        data: {
          menu: Menu.PAYMENT_TO_USER
        }
      },
      {
        path: 'scheduled-payments',
        component: SearchScheduledPaymentsComponent,
        data: {
          menu: Menu.SCHEDULED_PAYMENTS
        }
      },
      {
        path: 'recurring-payments',
        component: SearchRecurringPaymentsComponent,
        data: {
          menu: Menu.RECURRING_PAYMENTS
        }
      },
      {
        path: 'authorized-payments',
        component: SearchAuthorizedPaymentsComponent,
        data: {
          menu: Menu.AUTHORIZED_PAYMENTS
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
