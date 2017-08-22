import { NgModule } from '@angular/core';
import { SharedModule } from "app/shared/shared.module";
import { AccountsRoutingModule } from "app/banking/banking-routing.module";
import { AccountHistoryComponent } from "app/banking/accounts/account-history.component";
import { AccountsOverviewComponent } from "app/banking/accounts/accounts-overview.component";
import { BankingMessages } from "app/messages/banking-messages";
import { PerformPaymentComponent } from "app/banking/payments/perform-payment.component";
import { PaymentKindComponent } from "app/banking/payments/payment-kind.component";
import { PaymentUserComponent } from "app/banking/payments/payment-user.component";
import { PaymentIdMethodComponent } from "app/banking/payments/payment-id-method.component";

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
    AccountHistoryComponent,

    PerformPaymentComponent,
    PaymentKindComponent,
    PaymentIdMethodComponent,
    PaymentUserComponent
  ],
  providers: [
    BankingMessages
  ]
})
export class BankingModule {
}
