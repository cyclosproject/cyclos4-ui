import { Injectable } from '@angular/core';
import {
  ExternalPaymentStatusEnum, PaymentRequestStatusEnum,
  RecurringPaymentOccurrenceStatusEnum, RecurringPaymentStatusEnum,
  ScheduledPaymentInstallmentStatusEnum, ScheduledPaymentStatusEnum,
  TicketStatusEnum, TransactionAuthorizationActionEnum,
  TransactionAuthorizationStatusEnum, TransactionKind, TransactionResult,
  TransactionView
} from 'app/api/models';
import { Messages } from 'app/messages/messages';

/**
 * Service used to retrieve translations for transaction statuses, which are used in several places
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionStatusService {

  constructor(private messages: Messages) {
  }

  /**
   * Returns the transaction authorization status display
   */
  authorizationStatus(status: TransactionAuthorizationStatusEnum): string {
    switch (status) {
      case TransactionAuthorizationStatusEnum.AUTHORIZED:
        return this.messages.transaction.status.authorized;
      case TransactionAuthorizationStatusEnum.PENDING:
        return this.messages.transaction.status.pending;
      case TransactionAuthorizationStatusEnum.DENIED:
        return this.messages.transaction.status.denied;
      case TransactionAuthorizationStatusEnum.CANCELED:
        return this.messages.transaction.status.canceled;
      case TransactionAuthorizationStatusEnum.EXPIRED:
        return this.messages.transaction.status.expired;
    }
  }

  /**
   * Returns the scheduled payment status display
   */
  scheduledPaymentStatus(status: ScheduledPaymentStatusEnum): string {
    switch (status) {
      case ScheduledPaymentStatusEnum.OPEN:
        return this.messages.transaction.status.open;
      case ScheduledPaymentStatusEnum.BLOCKED:
        return this.messages.transaction.status.blocked;
      case ScheduledPaymentStatusEnum.CANCELED:
        return this.messages.transaction.status.canceled;
      case ScheduledPaymentStatusEnum.CLOSED:
        return this.messages.transaction.status.closed;
    }
  }

  /**
   * Returns the recurring payment status display
   */
  recurringPaymentStatus(status: RecurringPaymentStatusEnum): string {
    switch (status) {
      case RecurringPaymentStatusEnum.OPEN:
        return this.messages.transaction.status.open;
      case RecurringPaymentStatusEnum.CANCELED:
        return this.messages.transaction.status.canceled;
      case RecurringPaymentStatusEnum.CLOSED:
        return this.messages.transaction.status.closed;
    }
  }

  /**
   * Returns the recurring payment status display
   */
  paymentRequestStatus(status: PaymentRequestStatusEnum): string {
    switch (status) {
      case PaymentRequestStatusEnum.CANCELED:
        return this.messages.transaction.status.canceled;
      case PaymentRequestStatusEnum.DENIED:
        return this.messages.transaction.status.denied;
      case PaymentRequestStatusEnum.EXPIRED:
        return this.messages.transaction.status.expired;
      case PaymentRequestStatusEnum.OPEN:
        return this.messages.transaction.status.open;
      case PaymentRequestStatusEnum.SCHEDULED:
        return this.messages.transaction.status.scheduled;
      case PaymentRequestStatusEnum.PROCESSED:
        return this.messages.transaction.status.processed;
    }
  }

  /**
   * Returns the ticket status display
   */
  ticketStatus(status: TicketStatusEnum): string {
    switch (status) {
      case TicketStatusEnum.CANCELED:
        return this.messages.transaction.status.canceled;
      case TicketStatusEnum.EXPIRED:
        return this.messages.transaction.status.expired;
      case TicketStatusEnum.OPEN:
        return this.messages.transaction.status.open;
      case TicketStatusEnum.APPROVED:
        return this.messages.transaction.status.approved;
      case TicketStatusEnum.PROCESSED:
        return this.messages.transaction.status.processed;
    }
  }

  /**
   * Returns the external payment status display
   */
  externalPaymentStatus(status: ExternalPaymentStatusEnum): string {
    switch (status) {
      case ExternalPaymentStatusEnum.CANCELED:
        return this.messages.transaction.status.canceled;
      case ExternalPaymentStatusEnum.PENDING:
        return this.messages.transaction.status.pending;
      case ExternalPaymentStatusEnum.EXPIRED:
        return this.messages.transaction.status.expired;
      case ExternalPaymentStatusEnum.FAILED:
        return this.messages.transaction.status.failed;
      case ExternalPaymentStatusEnum.PROCESSED:
        return this.messages.transaction.status.processed;
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
  installmentStatus(status: ScheduledPaymentInstallmentStatusEnum): string {
    switch (status) {
      case ScheduledPaymentInstallmentStatusEnum.BLOCKED:
        return this.messages.transaction.status.blocked;
      case ScheduledPaymentInstallmentStatusEnum.CANCELED:
        return this.messages.transaction.status.canceled;
      case ScheduledPaymentInstallmentStatusEnum.FAILED:
        return this.messages.transaction.status.failed;
      case ScheduledPaymentInstallmentStatusEnum.PROCESSED:
        return this.messages.transaction.status.processed;
      case ScheduledPaymentInstallmentStatusEnum.SCHEDULED:
        return this.messages.transaction.status.scheduled;
      case ScheduledPaymentInstallmentStatusEnum.SETTLED:
        return this.messages.transaction.status.settled;
    }
  }

  /**
   * Returns the display for the given recurring payment occurrence status
   */
  occurrenceStatus(status: RecurringPaymentOccurrenceStatusEnum): string {
    switch (status) {
      case RecurringPaymentOccurrenceStatusEnum.FAILED:
        return this.messages.transaction.status.failed;
      case RecurringPaymentOccurrenceStatusEnum.PROCESSED:
        return this.messages.transaction.status.processed;
    }
  }

  /**
   * Returns the display for the given authorization action
   */
  authorizationAction(action: string): string {
    switch (action) {
      case TransactionAuthorizationActionEnum.AUTHORIZED:
        return this.messages.transaction.status.authorized;
      case TransactionAuthorizationActionEnum.DENIED:
        return this.messages.transaction.status.denied;
      case TransactionAuthorizationActionEnum.CANCELED:
        return this.messages.transaction.status.canceled;
    }
  }

}

