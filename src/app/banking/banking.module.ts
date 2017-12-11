import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { BankingRoutingModule } from 'app/banking/banking-routing.module';
import { BankingMessages } from 'app/messages/banking-messages';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { PerformPaymentComponent } from 'app/banking/payments/perform-payment.component';
import { PaymentKindComponent } from 'app/banking/payments/payment-kind.component';
import { PaymentUserComponent } from 'app/banking/payments/payment-user.component';
import { PaymentFieldsComponent } from 'app/banking/payments/payment-fields.component';
import { PaymentPreviewComponent } from 'app/banking/payments/payment-preview.component';
import { PaymentDoneComponent } from 'app/banking/payments/payment-done.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { ViewTransferDetailsComponent } from 'app/banking/transfers/view-transfer-details.component';

/**
 * Banking module
 */
@NgModule({
  imports: [
    BankingRoutingModule,
    SharedModule
  ],
  exports: [],
  declarations: [
    AccountHistoryComponent,

    ViewTransferComponent,
    ViewTransferDetailsComponent,
    ViewTransactionComponent,

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
