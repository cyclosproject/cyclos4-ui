import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { PaymentComponent } from 'app/banking/payment/payment.component';
import { ReceiveQrPaymentComponent } from 'app/banking/ticket/receive-qr-payment.component';
import { SearchOwnerInstallmentsComponent } from 'app/banking/transactions/search-owner-installments.component';
import { SearchOwnerTransactionsComponent } from 'app/banking/transactions/search-owner-transactions.component';
import { SearchTransactionsOverviewComponent } from 'app/banking/transactions/search-transactions-overview.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { SearchTransfersOverviewComponent } from 'app/banking/transfers/search-transfers-overview.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { BuyVouchersComponent } from 'app/banking/vouchers/buy-vouchers.component';
import { RedeemVoucherComponent } from 'app/banking/vouchers/redeem-voucher.component';
import { SearchBoughtVouchersComponent } from 'app/banking/vouchers/search-bought-vouchers.component';
import { SearchRedeemedVouchersComponent } from 'app/banking/vouchers/search-redeemed-vouchers.component';
import { SearchVouchersComponent } from 'app/banking/vouchers/search-vouchers.component';
import { ViewVoucherComponent } from 'app/banking/vouchers/view-voucher.component';
import { LoggedUserGuard } from 'app/logged-user-guard';

const bankingRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedUserGuard],
    children: [
      {
        path: ':owner/account/:type',
        component: AccountHistoryComponent,
      },
      {
        path: 'transfer/:key',
        component: ViewTransferComponent,
      },
      {
        path: 'transfer/:account/:key',
        component: ViewTransferComponent,
      },
      {
        path: 'transaction/:key',
        component: ViewTransactionComponent,
      },
      {
        path: 'transfers-overview',
        component: SearchTransfersOverviewComponent,
      },
      {
        path: 'transaction/:key/authorization-history',
        component: ViewAuthorizationHistoryComponent,
      },
      {
        path: ':from/payment',
        component: PaymentComponent,
      },
      {
        path: ':from/payment/:to',
        component: PaymentComponent,
      },
      {
        path: 'pos',
        component: PaymentComponent,
      },
      {
        path: 'qr',
        component: ReceiveQrPaymentComponent,
      },
      {
        path: ':owner/installments',
        component: SearchOwnerInstallmentsComponent,
      },
      {
        path: ':owner/authorized-payments',
        component: SearchOwnerTransactionsComponent,
        data: {
          kind: 'authorized'
        }
      },
      {
        path: 'authorized-payments',
        component: SearchTransactionsOverviewComponent,
        data: {
          kind: 'authorized'
        }
      },
      {
        path: 'pending-my-authorization',
        component: SearchTransactionsOverviewComponent,
        data: {
          kind: 'myAuth'
        }
      },
      {
        path: ':user/vouchers/redeem',
        component: RedeemVoucherComponent,
      },
      {
        path: ':user/vouchers/redeemed',
        component: SearchRedeemedVouchersComponent,
      },
      {
        path: ':user/vouchers/buy',
        component: BuyVouchersComponent,
      },
      {
        path: ':user/vouchers/bought',
        component: SearchBoughtVouchersComponent,
      },
      {
        path: 'vouchers/:key',
        component: ViewVoucherComponent,
      },
      {
        path: 'vouchers',
        component: SearchVouchersComponent,
      },
    ],
  },
];

/**
 * Routes for the banking module
 */
@NgModule({
  imports: [
    RouterModule.forChild(bankingRoutes),
  ],
  exports: [
    RouterModule,
  ],
})
export class BankingRoutingModule { }
