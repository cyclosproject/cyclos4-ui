import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { BankingMessagesResolve } from 'app/banking/banking-messages.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { PerformPaymentComponent } from 'app/banking/payments/perform-payment.component';
import { Menu } from 'app/shared/menu';

const accountRoutes: Routes = [
  {
    path: '',
    resolve: {
      bankingMessages: BankingMessagesResolve
    },
    canActivateChild: [LoggedUserGuard],
    children: [
      {
        path: 'account',
        component: AccountHistoryComponent,
        data: {
          menu: Menu.ACCOUNT
        }
      },
      {
        path: 'account/:type',
        component: AccountHistoryComponent,
        data: {
          menu: Menu.ACCOUNT
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
 * This module declares the routes in the accounts module
 */
@NgModule({
  imports: [
    RouterModule.forChild(accountRoutes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    BankingMessagesResolve
  ]
})
export class AccountsRoutingModule {}
