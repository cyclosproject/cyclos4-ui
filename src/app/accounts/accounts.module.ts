import { NgModule } from '@angular/core';
import { SharedModule } from "app/shared/shared.module";
import { AccountsRoutingModule } from "app/accounts/accounts-routing.module";
import { AccountHistoryComponent } from "app/accounts/account-history.component";
import { AccountsOverviewComponent } from "app/accounts/accounts-overview.component";
import { AccountMessages } from "app/messages/account-messages";

/**
 * Module for displaying an user's accounts and view transfer details
 */
@NgModule({
  imports: [
    AccountsRoutingModule,
    SharedModule
  ],
  exports: [],
  declarations: [
    AccountsOverviewComponent,
    AccountHistoryComponent
  ],
  providers: [
    AccountMessages
  ]
})
export class AccountsModule {
}
