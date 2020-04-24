import { NgModule } from '@angular/core';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { AccountStatusViewComponent } from 'app/banking/accounts/account-status-view.component';
import { BankingRoutingModule } from 'app/banking/banking-routing.module';
import { PaymentStepConfirmComponent } from 'app/banking/payment/payment-step-confirm.component';
import { PaymentStepDoneComponent } from 'app/banking/payment/payment-step-done.component';
import { PaymentStepFormComponent } from 'app/banking/payment/payment-step-form.component';
import { PaymentComponent } from 'app/banking/payment/payment.component';
import { SearchAuthorizedPaymentsComponent } from 'app/banking/transactions/search-authorized-payments.component';
import { SearchScheduledPaymentsComponent } from 'app/banking/transactions/search-scheduled-payments.component';
import { TransactionFitersComponent } from 'app/banking/transactions/transaction-filters.component';
import { ViewAuthorizationHistoryComponent } from 'app/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/banking/transactions/view-transaction.component';
import { SearchTransfersOverviewComponent } from 'app/banking/transfers/search-transfers-overview.component';
import { TransferDetailsComponent } from 'app/banking/transfers/transfer-details.component';
import { ViewTransferComponent } from 'app/banking/transfers/view-transfer.component';
import { BuyVouchersStepConfirmComponent } from 'app/banking/vouchers/buy-vouchers-step-confirm.component';
import { BuyVouchersStepFormComponent } from 'app/banking/vouchers/buy-vouchers-step-form.component';
import { BuyVouchersStepListTypesComponent } from 'app/banking/vouchers/buy-vouchers-step-list-types.component';
import { BuyVouchersComponent } from 'app/banking/vouchers/buy-vouchers.component';
import { SearchBoughtVouchersComponent } from 'app/banking/vouchers/search-bought-vouchers.component';
import { SearchVouchersComponent } from 'app/banking/vouchers/search-vouchers.component';
import { VoucherFiltersComponent } from 'app/banking/vouchers/voucher-filters.component';
import { SharedModule } from 'app/shared/shared.module';
import { RedeemVoucherComponent } from './vouchers/redeem-voucher.component';
import { SearchRedeemedVouchersComponent } from './vouchers/search-redeemed-vouchers.component';
import { ViewVoucherComponent } from './vouchers/view-voucher.component';

/**
 * Banking module
 */
@NgModule({
  imports: [
    BankingRoutingModule,
    SharedModule,
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
    TransactionFitersComponent,
    ViewTransactionComponent,

    PaymentComponent,
    PaymentStepFormComponent,
    PaymentStepConfirmComponent,
    PaymentStepDoneComponent,

    BuyVouchersComponent,
    SearchBoughtVouchersComponent,
    BuyVouchersStepListTypesComponent,
    BuyVouchersStepFormComponent,
    BuyVouchersStepConfirmComponent,
    RedeemVoucherComponent,
    ViewVoucherComponent,
    SearchRedeemedVouchersComponent,
    SearchVouchersComponent,
    VoucherFiltersComponent,
  ],
})
export class BankingModule {
}
