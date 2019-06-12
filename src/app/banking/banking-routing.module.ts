import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { PerformPaymentComponent } from 'app/banking/payment/perform-payment.component';
import { SearchAuthorizedPaymentsComponent } from 'app/banking/transactions/search-authorized-payments.component';
import { SearchScheduledPaymentsComponent } from 'app/banking/transactions/search-scheduled-payments.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { BuyVoucherComponent } from 'app/banking/vouchers/buy-voucher.component';
import { SearchBoughtVouchersComponent } from 'app/banking/vouchers/search-bought-vouchers.component';
import { VoucherTypesForBuyComponent } from 'app/banking/vouchers/voucher-types-for-buy.component';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { ActiveMenu, ConditionalMenu, Menu } from 'app/shared/menu';
import { trim } from 'lodash';

/**
 * A conditional menu resolver for content, which finds the content page by slug to resolve the correct menu
 */
const AccountMenu: ConditionalMenu = injector => {
  // The scope depends on the URL
  const url = injector.get(Router).url;
  // The first part is always the kind, and the last path part is always the operation key
  const parts = trim(url, '/').split('/');
  if (parts.length === 1) {
    // Invalid URL
    return null;
  }
  const key = parts[2];
  const accountType = injector.get(BankingHelperService).ownerAccountType(key);
  return new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: accountType });
};

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
          menu: AccountMenu
        }
      },
      {
        path: 'transfer/:key',
        component: ViewTransferComponent,
        data: {
          menu: Menu.ACCOUNT_HISTORY
        }
      },
      {
        path: 'transaction/:key',
        component: ViewTransactionComponent,
        data: {
          menu: Menu.ACCOUNT_HISTORY
        }
      },
      {
        path: 'transaction/:key/authorization-history',
        component: ViewAuthorizationHistoryComponent,
        data: {
          menu: Menu.ACCOUNT_HISTORY
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
        path: 'authorized-payments',
        component: SearchAuthorizedPaymentsComponent,
        data: {
          menu: Menu.AUTHORIZED_PAYMENTS
        }
      },
      {
        path: 'vouchers/buy',
        component: BuyVoucherComponent,
        data: {
          menu: Menu.BUY_VOUCHER
        }
      },
      {
        path: 'vouchers/search-bought',
        component: SearchBoughtVouchersComponent,
        data: {
          menu: Menu.SEARCH_BOUGHT_VOUCHERS
        }
      },
      {
        path: 'vouchers/for-buy',
        component: VoucherTypesForBuyComponent,
        data: {
          menu: Menu.LIST_VOUCHER_TYPES_FOR_BUY
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
