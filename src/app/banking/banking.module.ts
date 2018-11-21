import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { BankingRoutingModule } from 'app/banking/banking-routing.module';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { TransferDetailsComponent } from 'app/banking/transfers/transfer-details.component';
import { PerformPaymentComponent } from 'app/banking/payment/perform-payment.component';
import { PaymentStepFormComponent } from 'app/banking/payment/payment-step-form.component';
import { PaymentStepConfirmComponent } from 'app/banking/payment/payment-step-confirm.component';
import { PaymentStepDoneComponent } from 'app/banking/payment/payment-step-done.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { SearchScheduledPaymentsComponent } from 'app/banking/transactions/search-scheduled-payments.component';
import { SearchRecurringPaymentsComponent } from 'app/banking/transactions/search-recurring-payments.component';
import { SearchAuthorizedPaymentsComponent } from 'app/banking/transactions/search-authorized-payments.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';
import { TransactionFitersComponentComponent } from 'app/banking/transactions/transaction-filters.component';

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
    TransferDetailsComponent,
    ViewAuthorizationHistoryComponent,

    SearchScheduledPaymentsComponent,
    SearchRecurringPaymentsComponent,
    SearchAuthorizedPaymentsComponent,
    TransactionFitersComponentComponent,
    ViewTransactionComponent,

    PerformPaymentComponent,
    PaymentStepFormComponent,
    PaymentStepConfirmComponent,
    PaymentStepDoneComponent
  ]
})
export class BankingModule {
}
