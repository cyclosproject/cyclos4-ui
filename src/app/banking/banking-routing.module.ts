import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { PerformPaymentComponent } from 'app/banking/payment/perform-payment.component';
import { SearchAuthorizedPaymentsComponent } from 'app/banking/transactions/search-authorized-payments.component';
import { SearchScheduledPaymentsComponent } from 'app/banking/transactions/search-scheduled-payments.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { SearchTransfersOverviewComponent } from 'app/banking/transfers/search-transfers-overview.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { LoggedUserGuard } from 'app/logged-user-guard';


const bankingRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedUserGuard],
    children: [
      {
        path: ':owner/account/:type',
        component: AccountHistoryComponent
      },
      {
        path: 'transfer/:key',
        component: ViewTransferComponent
      },
      {
        path: 'transfer/:account/:key',
        component: ViewTransferComponent
      },
      {
        path: 'transaction/:key',
        component: ViewTransactionComponent
      },
      {
        path: 'transfers-overview',
        component: SearchTransfersOverviewComponent
      },
      {
        path: 'transaction/:key/authorization-history',
        component: ViewAuthorizationHistoryComponent
      },
      {
        path: ':from/payment',
        component: PerformPaymentComponent
      },
      {
        path: ':from/payment/:to',
        component: PerformPaymentComponent
      },
      {
        path: ':owner/scheduled-payments',
        component: SearchScheduledPaymentsComponent
      },
      {
        path: ':owner/authorized-payments',
        component: SearchAuthorizedPaymentsComponent
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
