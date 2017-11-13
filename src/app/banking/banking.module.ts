import { NgModule } from '@angular/core';
import { SharedModule } from "app/shared/shared.module";
import { AccountsRoutingModule } from "app/banking/banking-routing.module";
import { AccountHistoryComponent } from "app/banking/accounts/account-history.component";
import { BankingMessages } from "app/messages/banking-messages";
import { PerformPaymentComponent } from "app/banking/payments/perform-payment.component";
import { PaymentKindComponent } from "app/banking/payments/payment-kind.component";
import { PaymentUserComponent } from "app/banking/payments/payment-user.component";
import { PaymentFieldsComponent } from "app/banking/payments/payment-fields.component";
import { PaymentPreviewComponent } from 'app/banking/payments/payment-preview.component';
import { PaymentDoneComponent } from 'app/banking/payments/payment-done.component';

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
    AccountHistoryComponent,

    PerformPaymentComponent,
    PaymentKindComponent,
    PaymentUserComponent,
    PaymentFieldsComponent,
    PaymentPreviewComponent,
    PaymentDoneComponent
  ],
  providers: [
    BankingMessages
  ]
})
export class BankingModule {
}
