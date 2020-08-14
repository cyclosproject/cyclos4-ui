import { NgModule } from '@angular/core';
import { AccountHistoryComponent } from 'app/ui/banking/accounts/account-history.component';
import { SearchUserBalancesComponent } from 'app/ui/banking/accounts/search-user-balances.component';
import { BalancesSummaryComponent } from 'app/ui/banking/accounts/balances-summary.component';
import { AccountStatusViewComponent } from 'app/ui/banking/accounts/account-status-view.component';
import { EditAccountBalanceLimitsComponent } from 'app/ui/banking/balance-limits/edit-account-balance-limits.component';
import { ListAccountsBalanceLimitsComponent } from 'app/ui/banking/balance-limits/list-accounts-balance-limits.component';
import { SearchBalanceLimitsOverviewComponent } from 'app/ui/banking/balance-limits/search-balance-limits-overview.component';
import { ViewAccountBalanceLimitsComponent } from 'app/ui/banking/balance-limits/view-account-balance-limits.component';
import { BankingRoutingModule } from 'app/ui/banking/banking-routing.module';
import { EditAccountPaymentLimitsComponent } from 'app/ui/banking/payment-limits/edit-account-payment-limits.component';
import { ListAccountsPaymentLimitsComponent } from 'app/ui/banking/payment-limits/list-accounts-payment-limits.component';
import { SearchPaymentLimitsOverviewComponent } from 'app/ui/banking/payment-limits/search-payment-limits-overview.component';
import { ViewAccountPaymentLimitsComponent } from 'app/ui/banking/payment-limits/view-account-payment-limits.component';
import { PaymentStepConfirmComponent } from 'app/ui/banking/payment/payment-step-confirm.component';
import { PaymentStepDoneComponent } from 'app/ui/banking/payment/payment-step-done.component';
import { PaymentStepFormComponent } from 'app/ui/banking/payment/payment-step-form.component';
import { PaymentComponent } from 'app/ui/banking/payment/payment.component';
import { AcceptPaymentRequestStepConfirmComponent } from 'app/ui/banking/request-payment/accept-payment-request-step-confirm.component';
import { AcceptPaymentRequestComponent } from 'app/ui/banking/request-payment/accept-payment-request.component';
import { RequestPaymentStepDoneComponent } from 'app/ui/banking/request-payment/request-payment-step-done.component';
import { RequestPaymentStepFormComponent } from 'app/ui/banking/request-payment/request-payment-step-form.component';
import { RequestPaymentComponent } from 'app/ui/banking/request-payment/request-payment.component';
import { ReceiveQrPaymentStepDoneComponent } from 'app/ui/banking/ticket/receive-qr-payment-step-done.component';
import { ReceiveQrPaymentStepFormComponent } from 'app/ui/banking/ticket/receive-qr-payment-step-form.component';
import { ReceiveQrPaymentStepPendingComponent } from 'app/ui/banking/ticket/receive-qr-payment-step-pending.component';
import { ReceiveQrPaymentComponent } from 'app/ui/banking/ticket/receive-qr-payment.component';
import { SearchOwnerInstallmentsComponent } from 'app/ui/banking/transactions/search-owner-installments.component';
import { SearchInstallmentsComponent } from 'app/ui/banking/transactions/search-installments.component';
import { SearchOwnerTransactionsComponent } from 'app/ui/banking/transactions/search-owner-transactions.component';
import { SearchTransactionsOverviewComponent } from 'app/ui/banking/transactions/search-transactions-overview.component';
import { ViewAuthorizationHistoryComponent } from 'app/ui/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/ui/banking/transactions/view-transaction.component';
import { SearchTransfersOverviewComponent } from 'app/ui/banking/transfers/search-transfers-overview.component';
import { TransferDetailsComponent } from 'app/ui/banking/transfers/transfer-details.component';
import { ViewTransferComponent } from 'app/ui/banking/transfers/view-transfer.component';
import { BuyVouchersStepConfirmComponent } from 'app/ui/banking/vouchers/buy-vouchers-step-confirm.component';
import { BuyVouchersStepFormComponent } from 'app/ui/banking/vouchers/buy-vouchers-step-form.component';
import { BuyVouchersStepListTypesComponent } from 'app/ui/banking/vouchers/buy-vouchers-step-list-types.component';
import { BuyVouchersComponent } from 'app/ui/banking/vouchers/buy-vouchers.component';
import { SearchBoughtVouchersComponent } from 'app/ui/banking/vouchers/search-bought-vouchers.component';
import { SearchVouchersComponent } from 'app/ui/banking/vouchers/search-vouchers.component';
import { VoucherFiltersComponent } from 'app/ui/banking/vouchers/voucher-filters.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';
import { RedeemVoucherComponent } from './vouchers/redeem-voucher.component';
import { SearchRedeemedVouchersComponent } from './vouchers/search-redeemed-vouchers.component';
import { ViewVoucherComponent } from './vouchers/view-voucher.component';

/**
 * Banking module
 */
@NgModule({
  imports: [
    BankingRoutingModule,
    UiSharedModule,
  ],
  exports: [],
  declarations: [
    AccountHistoryComponent,
    AccountStatusViewComponent,
    ViewTransferComponent,
    TransferDetailsComponent,
    ViewAuthorizationHistoryComponent,
    SearchTransfersOverviewComponent,
    SearchUserBalancesComponent,
    BalancesSummaryComponent,

    SearchOwnerTransactionsComponent,
    SearchTransactionsOverviewComponent,
    SearchOwnerInstallmentsComponent,
    SearchInstallmentsComponent,
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
    SearchPaymentLimitsOverviewComponent,

    RequestPaymentComponent,
    RequestPaymentStepFormComponent,
    RequestPaymentStepDoneComponent,
    AcceptPaymentRequestComponent,
    AcceptPaymentRequestStepConfirmComponent
  ],
})
export class BankingModule {
}
