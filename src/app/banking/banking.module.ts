import { NgModule } from '@angular/core';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { AccountStatusViewComponent } from 'app/banking/accounts/account-status-view.component';
import { BankingRoutingModule } from 'app/banking/banking-routing.module';
import { PaymentStepConfirmComponent } from 'app/banking/payment/payment-step-confirm.component';
import { PaymentStepDoneComponent } from 'app/banking/payment/payment-step-done.component';
import { PaymentStepFormComponent } from 'app/banking/payment/payment-step-form.component';
import { PerformPaymentComponent } from 'app/banking/payment/perform-payment.component';
import { SearchAuthorizedPaymentsComponent } from 'app/banking/transactions/search-authorized-payments.component';
import { SearchScheduledPaymentsComponent } from 'app/banking/transactions/search-scheduled-payments.component';
import { TransactionFitersComponentComponent } from 'app/banking/transactions/transaction-filters.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { SearchTransfersOverviewComponent } from 'app/banking/transfers/search-transfers-overview.component';
import { TransferDetailsComponent } from 'app/banking/transfers/transfer-details.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { BuyVoucherComponent } from 'app/banking/vouchers/buy-voucher.component';
import { SearchBoughtVouchersComponent } from 'app/banking/vouchers/search-bought-vouchers.component';
import { VoucherTypesForBuyComponent } from 'app/banking/vouchers/voucher-types-for-buy.component';
import { SharedModule } from 'app/shared/shared.module';
import { RedeemVoucherComponent } from 'app/banking/vouchers/redeem-voucher.component';
import { ViewVoucherComponent } from 'app/banking/vouchers/view-voucher.component';
import { SearchRedeemedVouchersComponent } from 'app/banking/vouchers/search-redeemed-vouchers.component';

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
    AccountStatusViewComponent,
    ViewTransferComponent,
    TransferDetailsComponent,
    ViewAuthorizationHistoryComponent,
    SearchTransfersOverviewComponent,

    SearchScheduledPaymentsComponent,
    SearchAuthorizedPaymentsComponent,
    TransactionFitersComponentComponent,
    ViewTransactionComponent,

    PerformPaymentComponent,
    PaymentStepFormComponent,
    PaymentStepConfirmComponent,
    PaymentStepDoneComponent,

    BuyVoucherComponent,
    SearchBoughtVouchersComponent,
    VoucherTypesForBuyComponent,
    RedeemVoucherComponent,
    ViewVoucherComponent,
    SearchRedeemedVouchersComponent
  ]
})
export class BankingModule {
}
