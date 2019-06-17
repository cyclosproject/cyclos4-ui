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
import { AuthHelperService } from 'app/core/auth-helper.service';
import { SearchTransfersOverviewComponent } from 'app/banking/transfers/search-transfers-overview.component';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { RoleEnum } from 'app/api/models';

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

const PaymentMenu: ConditionalMenu = injector => {
  // The scope depends on the URL
  const url = injector.get(Router).url;
  const parts = trim(url, '/').split('/');
  // /banking/:user/payment[/:to]
  const from = parts[1];
  const to = parts[3];
  const authHelper = injector.get(AuthHelperService);
  let ownMenu: Menu = null;
  if (authHelper.isSelf(from)) {
    if (authHelper.isSelf(to)) {
      ownMenu = Menu.PAYMENT_TO_SELF;
    } else if (authHelper.isSystem(to)) {
      ownMenu = Menu.PAYMENT_TO_SYSTEM;
    } else {
      ownMenu = Menu.PAYMENT_TO_USER;
    }
  }
  return AuthHelperService.menuByRole(ownMenu)(injector);
};

const TransfersOverviewMenu: ConditionalMenu = injector => {
  const role = injector.get(DataForUiHolder).role;
  switch (role) {
    case RoleEnum.ADMINISTRATOR:
      return Menu.ADMIN_TRANSFERS_OVERVIEW;
    case RoleEnum.BROKER:
      return Menu.BROKER_TRANSFERS_OVERVIEW;
  }
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
        path: 'transfers-overview',
        component: SearchTransfersOverviewComponent,
        data: {
          menu: TransfersOverviewMenu
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
        path: ':from/payment',
        component: PerformPaymentComponent,
        data: {
          menu: PaymentMenu
        }
      },
      {
        path: ':from/payment/:to',
        component: PerformPaymentComponent,
        data: {
          menu: PaymentMenu
        }
      },
      {
        path: ':owner/scheduled-payments',
        component: SearchScheduledPaymentsComponent,
        data: {
          menu: AuthHelperService.menuByRole(Menu.SCHEDULED_PAYMENTS)
        }
      },
      {
        path: ':owner/authorized-payments',
        component: SearchAuthorizedPaymentsComponent,
        data: {
          menu: AuthHelperService.menuByRole(Menu.AUTHORIZED_PAYMENTS)
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
