import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AccountsOverviewComponent } from "app/accounts/accounts-overview.component";
import { AccountHistoryComponent } from "app/accounts/account-history.component";
import { AccountMessagesResolve } from "app/accounts/account-messages.resolve";
import { LoggedUserGuard } from "app/routing/logged-user-guard";

const accountRoutes: Routes = [
  {
    path: '',
    resolve: {
      accountMessages: AccountMessagesResolve
    },
    canActivateChild: [LoggedUserGuard],
    children: [
      {
        path: '',
        component: AccountsOverviewComponent
      },
      {
        path: 'history/:type',
        component: AccountHistoryComponent
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
    AccountMessagesResolve
  ]
})
export class AccountsRoutingModule {}