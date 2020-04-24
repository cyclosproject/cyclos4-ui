import { Injectable } from '@angular/core';
import {
  ExternalPaymentStatusEnum, InstallmentStatusEnum,
  PaymentRequestStatusEnum, RecurringPaymentStatusEnum,
  ScheduledPaymentStatusEnum,
  TicketStatusEnum, TransactionAuthorizationActionEnum,
  TransactionAuthorizationStatusEnum, TransactionKind, TransactionResult,
  TransactionView,
} from 'app/api/models';
import { I18n } from 'app/i18n/i18n';

/**
 * Service used to retrieve translations for transaction statuses, which are used in several places
 */
@Injectable({
  providedIn: 'root',
})
export class TransactionStatusService {

  constructor(private i18n: I18n) {
  }

  /**
   * Returns the transaction authorization status display
   */
  authorizationStatus(status: TransactionAuthorizationStatusEnum): string {
    switch (status) {
      case TransactionAuthorizationStatusEnum.AUTHORIZED:
        return this.i18n.transaction.status.authorized;
      case TransactionAuthorizationStatusEnum.PENDING:
        return this.i18n.transaction.status.pending;
      case TransactionAuthorizationStatusEnum.DENIED:
        return this.i18n.transaction.status.denied;
      case TransactionAuthorizationStatusEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
      case TransactionAuthorizationStatusEnum.EXPIRED:
        return this.i18n.transaction.status.expired;
    }
  }

  /**
   * Returns the scheduled payment status display
   */
  scheduledPaymentStatus(status: ScheduledPaymentStatusEnum): string {
    switch (status) {
      case ScheduledPaymentStatusEnum.OPEN:
        return this.i18n.transaction.status.open;
      case ScheduledPaymentStatusEnum.BLOCKED:
        return this.i18n.transaction.status.blocked;
      case ScheduledPaymentStatusEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
      case ScheduledPaymentStatusEnum.CLOSED:
        return this.i18n.transaction.status.closed;
    }
  }

  /**
   * Returns the recurring payment status display
   */
  recurringPaymentStatus(status: RecurringPaymentStatusEnum): string {
    switch (status) {
      case RecurringPaymentStatusEnum.OPEN:
        return this.i18n.transaction.status.open;
      case RecurringPaymentStatusEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
      case RecurringPaymentStatusEnum.CLOSED:
        return this.i18n.transaction.status.closed;
    }
  }

  /**
   * Returns the recurring payment status display
   */
  paymentRequestStatus(status: PaymentRequestStatusEnum): string {
    switch (status) {
      case PaymentRequestStatusEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
      case PaymentRequestStatusEnum.DENIED:
        return this.i18n.transaction.status.denied;
      case PaymentRequestStatusEnum.EXPIRED:
        return this.i18n.transaction.status.expired;
      case PaymentRequestStatusEnum.OPEN:
        return this.i18n.transaction.status.open;
      case PaymentRequestStatusEnum.SCHEDULED:
        return this.i18n.transaction.status.scheduled;
      case PaymentRequestStatusEnum.PROCESSED:
        return this.i18n.transaction.status.processed;
    }
  }

  /**
   * Returns the ticket status display
   */
  ticketStatus(status: TicketStatusEnum): string {
    switch (status) {
      case TicketStatusEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
      case TicketStatusEnum.EXPIRED:
        return this.i18n.transaction.status.expired;
      case TicketStatusEnum.OPEN:
        return this.i18n.transaction.status.open;
      case TicketStatusEnum.APPROVED:
        return this.i18n.transaction.status.approved;
      case TicketStatusEnum.PROCESSED:
        return this.i18n.transaction.status.processed;
    }
  }

  /**
   * Returns the external payment status display
   */
  externalPaymentStatus(status: ExternalPaymentStatusEnum): string {
    switch (status) {
      case ExternalPaymentStatusEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
      case ExternalPaymentStatusEnum.PENDING:
        return this.i18n.transaction.status.pending;
      case ExternalPaymentStatusEnum.EXPIRED:
        return this.i18n.transaction.status.expired;
      case ExternalPaymentStatusEnum.FAILED:
        return this.i18n.transaction.status.failed;
      case ExternalPaymentStatusEnum.PROCESSED:
        return this.i18n.transaction.status.processed;
    }
  }

  /**
   * Returns the status string for the given transaction
   */
  transactionStatus(tx: TransactionResult | TransactionView): string {
    if (tx.authorizationStatus != null && tx.authorizationStatus !== TransactionAuthorizationStatusEnum.AUTHORIZED) {
      return this.authorizationStatus(tx.authorizationStatus);
    }
    switch (tx.kind) {
      case TransactionKind.SCHEDULED_PAYMENT:
        return this.scheduledPaymentStatus(tx.scheduledPaymentStatus);
      case TransactionKind.RECURRING_PAYMENT:
        return this.recurringPaymentStatus(tx.recurringPaymentStatus);
      case TransactionKind.PAYMENT_REQUEST:
        return this.paymentRequestStatus(tx.paymentRequestStatus);
      case TransactionKind.TICKET:
        return this.ticketStatus(tx.ticketStatus);
      case TransactionKind.EXTERNAL_PAYMENT:
        return this.externalPaymentStatus(tx.externalPaymentStatus);
    }
  }

  /**
   * Returns the display for the given installment status
   */
  installmentStatus(status: InstallmentStatusEnum): string {
    switch (status) {
      case InstallmentStatusEnum.BLOCKED:
        return this.i18n.transaction.status.blocked;
      case InstallmentStatusEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
      case InstallmentStatusEnum.FAILED:
        return this.i18n.transaction.status.failed;
      case InstallmentStatusEnum.PROCESSED:
        return this.i18n.transaction.status.processed;
      case InstallmentStatusEnum.SCHEDULED:
        return this.i18n.transaction.status.scheduled;
      case InstallmentStatusEnum.SETTLED:
        return this.i18n.transaction.status.settled;
    }
  }

  /**
   * Returns the display for the given authorization action
   */
  authorizationAction(action: string): string {
    switch (action) {
      case TransactionAuthorizationActionEnum.AUTHORIZED:
        return this.i18n.transaction.status.authorized;
      case TransactionAuthorizationActionEnum.DENIED:
        return this.i18n.transaction.status.denied;
      case TransactionAuthorizationActionEnum.CANCELED:
        return this.i18n.transaction.status.canceled;
    }
  }

}
