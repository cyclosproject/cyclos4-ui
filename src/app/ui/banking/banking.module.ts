import { NgModule } from '@angular/core';
import { AccountVisibilitySettingsComponent } from 'app/ui/banking/account-visibility-settings/account-visibility-settings.component';
import { AccountHistoryComponent } from 'app/ui/banking/accounts/account-history.component';
import { AccountStatusViewComponent } from 'app/ui/banking/accounts/account-status-view.component';
import { BalancesSummaryComponent } from 'app/ui/banking/accounts/balances-summary.component';
import { ListAccountsComponent } from 'app/ui/banking/accounts/list-accounts.component';
import { SearchUserBalancesComponent } from 'app/ui/banking/accounts/search-user-balances.component';
import { EditAccountBalanceLimitsComponent } from 'app/ui/banking/balance-limits/edit-account-balance-limits.component';
import { ListAccountsBalanceLimitsComponent } from 'app/ui/banking/balance-limits/list-accounts-balance-limits.component';
import { SearchBalanceLimitsOverviewComponent } from 'app/ui/banking/balance-limits/search-balance-limits-overview.component';
import { ViewAccountBalanceLimitsComponent } from 'app/ui/banking/balance-limits/view-account-balance-limits.component';
import { BankingRoutingModule } from 'app/ui/banking/banking-routing.module';
import { ExternalPaymentStepConfirmComponent } from 'app/ui/banking/external-payment/external-payment-step-confirm.component';
import { ExternalPaymentStepFormComponent } from 'app/ui/banking/external-payment/external-payment-step-form.component';
import { ExternalPaymentComponent } from 'app/ui/banking/external-payment/external-payment.component';
import { EditAccountPaymentLimitsComponent } from 'app/ui/banking/payment-limits/edit-account-payment-limits.component';
import { ListAccountsPaymentLimitsComponent } from 'app/ui/banking/payment-limits/list-accounts-payment-limits.component';
import { SearchPaymentLimitsOverviewComponent } from 'app/ui/banking/payment-limits/search-payment-limits-overview.component';
import { ViewAccountPaymentLimitsComponent } from 'app/ui/banking/payment-limits/view-account-payment-limits.component';
import { PaymentStepConfirmComponent } from 'app/ui/banking/payment/payment-step-confirm.component';
import { PaymentStepFormComponent } from 'app/ui/banking/payment/payment-step-form.component';
import { PaymentComponent } from 'app/ui/banking/payment/payment.component';
import { AcceptPaymentRequestConfirmComponent } from 'app/ui/banking/request-payment/accept-payment-request-confirm.component';
import { AcceptPaymentRequestComponent } from 'app/ui/banking/request-payment/accept-payment-request.component';
import { RequestPaymentFormComponent } from 'app/ui/banking/request-payment/request-payment-form.component';
import { RequestPaymentComponent } from 'app/ui/banking/request-payment/request-payment.component';
import { ReceiveQrPaymentStepFormComponent } from 'app/ui/banking/ticket/receive-qr-payment-step-form.component';
import { ReceiveQrPaymentStepPendingComponent } from 'app/ui/banking/ticket/receive-qr-payment-step-pending.component';
import { ReceiveQrPaymentComponent } from 'app/ui/banking/ticket/receive-qr-payment.component';
import { EditRecurringPaymentComponent } from 'app/ui/banking/transactions/edit-recurring-payment.component';
import { ReschedulePaymentRequestDialogComponent } from 'app/ui/banking/transactions/reschedule-payment-request-dialog.component';
import { SearchInstallmentsComponent } from 'app/ui/banking/transactions/search-installments.component';
import { SearchOwnerInstallmentsComponent } from 'app/ui/banking/transactions/search-owner-installments.component';
import { SearchOwnerTransactionsComponent } from 'app/ui/banking/transactions/search-owner-transactions.component';
import { SearchTransactionsOverviewComponent } from 'app/ui/banking/transactions/search-transactions-overview.component';
import { ViewAuthorizationHistoryComponent } from 'app/ui/banking/transactions/view-authorization-history.component';
import { ViewTransactionComponent } from 'app/ui/banking/transactions/view-transaction.component';
import { SearchTransfersOverviewComponent } from 'app/ui/banking/transfers/search-transfers-overview.component';
import { TransferDetailsComponent } from 'app/ui/banking/transfers/transfer-details.component';
import { TransferSimpleDetailsComponent } from 'app/ui/banking/transfers/transfer-simple-details.component';
import { ViewTransferComponent } from 'app/ui/banking/transfers/view-transfer.component';
import { VoucherDetailsComponent } from 'app/ui/banking/transfers/voucher-details.component';
import { BuyVouchersStepConfirmComponent } from 'app/ui/banking/vouchers/buy-vouchers-step-confirm.component';
import { BuyVouchersStepFormComponent } from 'app/ui/banking/vouchers/buy-vouchers-step-form.component';
import { BuyVouchersComponent } from 'app/ui/banking/vouchers/buy-vouchers.component';
import { GenerateVouchersStepConfirmComponent } from 'app/ui/banking/vouchers/generate-vouchers-step-confirm.component';
import { GenerateVouchersStepFormComponent } from 'app/ui/banking/vouchers/generate-vouchers-step-form.component';
import { GenerateVouchersComponent } from 'app/ui/banking/vouchers/generate-vouchers.component';
import { RedeemVoucherComponent } from 'app/ui/banking/vouchers/redeem-voucher.component';
import { SearchUserVouchersComponent } from 'app/ui/banking/vouchers/search-user-vouchers.component';
import { SearchVoucherTransactionsComponent } from 'app/ui/banking/vouchers/search-voucher-transactions.component';
import { SearchVouchersComponent } from 'app/ui/banking/vouchers/search-vouchers.component';
import { SendVoucherStepConfirmComponent } from 'app/ui/banking/vouchers/send-voucher-step-confirm.component';
import { SendVoucherStepFormComponent } from 'app/ui/banking/vouchers/send-voucher-step-form.component';
import { SendVoucherComponent } from 'app/ui/banking/vouchers/send-voucher.component';
import { TopUpVoucherComponent } from 'app/ui/banking/vouchers/top-up-voucher.component';
import { ViewVoucherTransactionComponent } from 'app/ui/banking/vouchers/view-voucher-transaction.component';
import { ViewVoucherComponent } from 'app/ui/banking/vouchers/view-voucher.component';
import { VoucherChangePinDialogComponent } from 'app/ui/banking/vouchers/voucher-change-pin-dialog.component';
import { VoucherFiltersComponent } from 'app/ui/banking/vouchers/voucher-filters.component';
import { VoucherNotificationSettingsDialogComponent } from 'app/ui/banking/vouchers/voucher-notification-settings-dialog.component';
import { VoucherTransactionStepConfirmComponent } from 'app/ui/banking/vouchers/voucher-transaction-step-confirm.component';
import { VoucherTransactionStepFormComponent } from 'app/ui/banking/vouchers/voucher-transaction-step-form.component';
import { VoucherTransactionStepTokenComponent } from 'app/ui/banking/vouchers/voucher-transaction-step-token.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Banking module
 */
@NgModule({
  imports: [
    BankingRoutingModule,
    UiSharedModule
  ],
  exports: [],
  declarations: [
    AccountHistoryComponent,
    AccountVisibilitySettingsComponent,
    AccountStatusViewComponent,
    ViewTransferComponent,
    TransferDetailsComponent,
    TransferSimpleDetailsComponent,
    VoucherDetailsComponent,
    ViewAuthorizationHistoryComponent,
    SearchTransfersOverviewComponent,
    SearchUserBalancesComponent,
    BalancesSummaryComponent,
    ListAccountsComponent,

    SearchOwnerTransactionsComponent,
    SearchTransactionsOverviewComponent,
    SearchOwnerInstallmentsComponent,
    SearchInstallmentsComponent,
    ViewTransactionComponent,
    ReschedulePaymentRequestDialogComponent,

    PaymentComponent,
    PaymentStepFormComponent,
    PaymentStepConfirmComponent,

    ReceiveQrPaymentComponent,
    ReceiveQrPaymentStepFormComponent,
    ReceiveQrPaymentStepPendingComponent,

    BuyVouchersComponent,
    SendVoucherComponent,
    SearchUserVouchersComponent,
    BuyVouchersStepFormComponent,
    BuyVouchersStepConfirmComponent,
    SendVoucherStepFormComponent,
    SendVoucherStepConfirmComponent,
    RedeemVoucherComponent,
    TopUpVoucherComponent,
    VoucherTransactionStepTokenComponent,
    VoucherTransactionStepFormComponent,
    VoucherTransactionStepConfirmComponent,
    ViewVoucherComponent,
    ViewVoucherTransactionComponent,
    VoucherNotificationSettingsDialogComponent,
    VoucherChangePinDialogComponent,
    SearchVoucherTransactionsComponent,
    SearchVouchersComponent,
    VoucherFiltersComponent,
    GenerateVouchersComponent,
    GenerateVouchersStepFormComponent,
    GenerateVouchersStepConfirmComponent,

    ViewAccountBalanceLimitsComponent,
    EditAccountBalanceLimitsComponent,
    ListAccountsBalanceLimitsComponent,
    SearchBalanceLimitsOverviewComponent,

    ViewAccountPaymentLimitsComponent,
    EditAccountPaymentLimitsComponent,
    ListAccountsPaymentLimitsComponent,
    SearchPaymentLimitsOverviewComponent,

    RequestPaymentComponent,
    RequestPaymentFormComponent,
    AcceptPaymentRequestComponent,
    AcceptPaymentRequestConfirmComponent,

    ExternalPaymentComponent,
    ExternalPaymentStepFormComponent,
    ExternalPaymentStepConfirmComponent,

    EditRecurringPaymentComponent
  ]
})
export class BankingModule {
}
