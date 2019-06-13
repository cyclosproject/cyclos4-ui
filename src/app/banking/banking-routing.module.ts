import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { Menu, ConditionalMenu, ActiveMenu } from 'app/shared/menu';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { PerformPaymentComponent } from 'app/banking/payment/perform-payment.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { SearchScheduledPaymentsComponent } from 'app/banking/transactions/search-scheduled-payments.component';
import { SearchAuthorizedPaymentsComponent } from 'app/banking/transactions/search-authorized-payments.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';
import { trim } from 'lodash';
import { BankingHelperService } from 'app/core/banking-helper.service';

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
        path: ':owner/account/:type',
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
