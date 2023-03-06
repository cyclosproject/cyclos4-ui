import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountVisibilitySettingsComponent } from 'app/ui/banking/account-visibility-settings/account-visibility-settings.component';
import { AccountHistoryComponent } from 'app/ui/banking/accounts/account-history.component';
import { ListAccountsComponent } from 'app/ui/banking/accounts/list-accounts.component';
import { SearchUserBalancesComponent } from 'app/ui/banking/accounts/search-user-balances.component';
import { EditAccountBalanceLimitsComponent } from 'app/ui/banking/balance-limits/edit-account-balance-limits.component';
import { ListAccountsBalanceLimitsComponent } from 'app/ui/banking/balance-limits/list-accounts-balance-limits.component';
import { SearchBalanceLimitsOverviewComponent } from 'app/ui/banking/balance-limits/search-balance-limits-overview.component';
import { ViewAccountBalanceLimitsComponent } from 'app/ui/banking/balance-limits/view-account-balance-limits.component';
import { ExternalPaymentComponent } from 'app/ui/banking/external-payment/external-payment.component';
import { EditAccountPaymentLimitsComponent } from 'app/ui/banking/payment-limits/edit-account-payment-limits.component';
import { ListAccountsPaymentLimitsComponent } from 'app/ui/banking/payment-limits/list-accounts-payment-limits.component';
import { SearchPaymentLimitsOverviewComponent } from 'app/ui/banking/payment-limits/search-payment-limits-overview.component';
import { ViewAccountPaymentLimitsComponent } from 'app/ui/banking/payment-limits/view-account-payment-limits.component';
import { PaymentComponent } from 'app/ui/banking/payment/payment.component';
import { AcceptPaymentRequestComponent } from 'app/ui/banking/request-payment/accept-payment-request.component';
import { RequestPaymentComponent } from 'app/ui/banking/request-payment/request-payment.component';
import { ReceiveQrPaymentComponent } from 'app/ui/banking/ticket/receive-qr-payment.component';
import { EditRecurringPaymentComponent } from 'app/ui/banking/transactions/edit-recurring-payment.component';
import { SearchInstallmentsComponent } from 'app/ui/banking/transactions/search-installments.component';
import { SearchOwnerInstallmentsComponent } from 'app/ui/banking/transactions/search-owner-installments.component';
import { SearchOwnerTransactionsComponent } from 'app/ui/banking/transactions/search-owner-transactions.component';
import { SearchTransactionsOverviewComponent } from 'app/ui/banking/transactions/search-transactions-overview.component';
import { ViewAuthorizationHistoryComponent } from 'app/ui/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/ui/banking/transactions/view-transaction.component';
import { SearchTransfersOverviewComponent } from 'app/ui/banking/transfers/search-transfers-overview.component';
import { ViewTransferComponent } from 'app/ui/banking/transfers/view-transfer.component';
import { BuyVouchersComponent } from 'app/ui/banking/vouchers/buy-vouchers.component';
import { GenerateVouchersComponent } from 'app/ui/banking/vouchers/generate-vouchers.component';
import { RedeemVoucherComponent } from 'app/ui/banking/vouchers/redeem-voucher.component';
import { SearchUserVouchersComponent } from 'app/ui/banking/vouchers/search-user-vouchers.component';
import { SearchVoucherTransactionsComponent } from 'app/ui/banking/vouchers/search-voucher-transactions.component';
import { SearchVouchersComponent } from 'app/ui/banking/vouchers/search-vouchers.component';
import { SendVoucherComponent } from 'app/ui/banking/vouchers/send-voucher.component';
import { TopUpVoucherComponent } from 'app/ui/banking/vouchers/top-up-voucher.component';
import { ViewVoucherTransactionComponent } from 'app/ui/banking/vouchers/view-voucher-transaction.component';
import { ViewVoucherComponent } from 'app/ui/banking/vouchers/view-voucher.component';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';

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
        path: ':owner/accounts-summary',
        component: ListAccountsComponent,
      },
      {
        path: ':user/account-visibility',
        component: AccountVisibilitySettingsComponent,
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
        path: ':from/payment-request',
        component: RequestPaymentComponent,
      },
      {
        path: 'payment-request/:key/accept',
        component: AcceptPaymentRequestComponent,
      },
      {
        path: ':from/payment-request/:to',
        component: RequestPaymentComponent,
      },
      {
        path: ':owner/payment-requests',
        component: SearchOwnerTransactionsComponent,
        data: {
          kind: 'payment-request'
        }
      },
      {
        path: ':owner/tickets',
        component: SearchOwnerTransactionsComponent,
        data: {
          kind: 'ticket'
        }
      },
      {
        path: 'payment-requests',
        component: SearchTransactionsOverviewComponent,
        data: {
          kind: 'payment-request'
        }
      },
      {
        path: 'tickets',
        component: SearchTransactionsOverviewComponent,
        data: {
          kind: 'ticket'
        }
      },
      {
        path: ':owner/external-payments',
        component: SearchOwnerTransactionsComponent,
        data: {
          kind: 'external-payment'
        }
      },
      {
        path: 'external-payments',
        component: SearchTransactionsOverviewComponent,
        data: {
          kind: 'external-payment'
        }
      },
      {
        path: ':owner/external-payment',
        component: ExternalPaymentComponent,
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
        path: 'installments-overview',
        component: SearchInstallmentsComponent,
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
        path: ':user/vouchers',
        component: SearchUserVouchersComponent,
      },
      {
        path: ':user/vouchers/redeem',
        component: RedeemVoucherComponent,
      },
      {
        path: ':user/vouchers/top-up',
        component: TopUpVoucherComponent,
      },
      {
        path: ':user/vouchers/buy',
        component: BuyVouchersComponent,
      },
      {
        path: ':user/vouchers/send',
        component: SendVoucherComponent,
      },
      {
        path: 'vouchers',
        component: SearchVouchersComponent,
      },
      {
        path: 'vouchers/view/:key',
        component: ViewVoucherComponent,
      },
      {
        path: ':user/voucher-transactions',
        component: SearchVoucherTransactionsComponent,
      },
      {
        path: 'voucher-transactions/view/:id',
        component: ViewVoucherTransactionComponent,
      },
      {
        path: ':user/account-balance-limits',
        component: ListAccountsBalanceLimitsComponent,
      },
      {
        path: ':user/account-balance-limits/:accountType',
        component: ViewAccountBalanceLimitsComponent,
      },
      {
        path: ':user/account-balance-limits/:accountType/edit',
        component: EditAccountBalanceLimitsComponent,
      },
      {
        path: 'account-balance-limits-overview',
        component: SearchBalanceLimitsOverviewComponent,
      },
      {
        path: ':user/account-payment-limits',
        component: ListAccountsPaymentLimitsComponent,
      },
      {
        path: ':user/account-payment-limits/:accountType',
        component: ViewAccountPaymentLimitsComponent,
      },
      {
        path: ':user/account-payment-limits/:accountType/edit',
        component: EditAccountPaymentLimitsComponent,
      },
      {
        path: 'account-payment-limits-overview',
        component: SearchPaymentLimitsOverviewComponent,
      },
      {
        path: 'user-balances-overview',
        component: SearchUserBalancesComponent,
      },
      {
        path: 'vouchers/generate',
        component: GenerateVouchersComponent,
      },
      {
        path: 'edit-recurring-payment/:id',
        component: EditRecurringPaymentComponent,
      }
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
