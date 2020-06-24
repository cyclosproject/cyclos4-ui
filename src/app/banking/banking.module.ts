import { NgModule } from '@angular/core';
import { AccountHistoryComponent } from 'app/banking/accounts/account-history.component';
import { AccountStatusViewComponent } from 'app/banking/accounts/account-status-view.component';
import { EditAccountBalanceLimitsComponent } from 'app/banking/balance-limits/edit-account-balance-limits.component';
import { ListAccountsBalanceLimitsComponent } from 'app/banking/balance-limits/list-accounts-balance-limits.component';
import { SearchBalanceLimitsOverviewComponent } from 'app/banking/balance-limits/search-balance-limits-overview.component';
import { ViewAccountBalanceLimitsComponent } from 'app/banking/balance-limits/view-account-balance-limits.component';
import { BankingRoutingModule } from 'app/banking/banking-routing.module';
import { EditAccountPaymentLimitsComponent } from 'app/banking/payment-limits/edit-account-payment-limits.component';
import { ListAccountsPaymentLimitsComponent } from 'app/banking/payment-limits/list-accounts-payment-limits.component';
import { SearchPaymentLimitsOverviewComponent } from 'app/banking/payment-limits/search-payment-limits-overview.component';
import { ViewAccountPaymentLimitsComponent } from 'app/banking/payment-limits/view-account-payment-limits.component';
import { PaymentStepConfirmComponent } from 'app/banking/payment/payment-step-confirm.component';
import { PaymentStepDoneComponent } from 'app/banking/payment/payment-step-done.component';
import { PaymentStepFormComponent } from 'app/banking/payment/payment-step-form.component';
import { PaymentComponent } from 'app/banking/payment/payment.component';
import { ReceiveQrPaymentStepDoneComponent } from 'app/banking/ticket/receive-qr-payment-step-done.component';
import { ReceiveQrPaymentStepFormComponent } from 'app/banking/ticket/receive-qr-payment-step-form.component';
import { ReceiveQrPaymentStepPendingComponent } from 'app/banking/ticket/receive-qr-payment-step-pending.component';
import { ReceiveQrPaymentComponent } from 'app/banking/ticket/receive-qr-payment.component';
import { SearchOwnerInstallmentsComponent } from 'app/banking/transactions/search-owner-installments.component';
import { SearchOwnerTransactionsComponent } from 'app/banking/transactions/search-owner-transactions.component';
import { SearchTransactionsOverviewComponent } from 'app/banking/transactions/search-transactions-overview.component';
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

    SearchOwnerTransactionsComponent,
    SearchTransactionsOverviewComponent,
    SearchOwnerInstallmentsComponent,
    ViewTransactionComponent,

    PaymentComponent,
    PaymentStepFormComponent,
    PaymentStepConfirmComponent,
    PaymentStepDoneComponent,

    ReceiveQrPaymentComponent,
    ReceiveQrPaymentStepFormComponent,
    ReceiveQrPaymentStepPendingComponent,
    ReceiveQrPaymentStepDoneComponent,

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

    ViewAccountBalanceLimitsComponent,
    EditAccountBalanceLimitsComponent,
    ListAccountsBalanceLimitsComponent,
    SearchBalanceLimitsOverviewComponent,

    ViewAccountPaymentLimitsComponent,
    EditAccountPaymentLimitsComponent,
    ListAccountsPaymentLimitsComponent,
    SearchPaymentLimitsOverviewComponent
  ],
})
export class BankingModule {
}
