import { Injectable } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import {
  ExternalPaymentStatusEnum, PaymentRequestStatusEnum, RecurringPaymentStatusEnum,
  ScheduledPaymentStatusEnum, TicketStatusEnum, TransactionAuthorizationStatusEnum,
  TransactionKind, TransactionResult, TransactionView, ScheduledPaymentInstallmentStatusEnum, RecurringPaymentOccurrenceStatusEnum
} from 'app/api/models';

/**
 * Service used to retrieve translations for transaction statuses, which are used in several places
 */
@Injectable({
  providedIn: 'root'
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
        return this.i18n('Authorized');
      case TransactionAuthorizationStatusEnum.PENDING:
        return this.i18n('Pending authorization');
      case TransactionAuthorizationStatusEnum.DENIED:
        return this.i18n('Denied');
      case TransactionAuthorizationStatusEnum.CANCELED:
        return this.i18n('Canceled');
    }
  }

  /**
   * Returns the scheduled payment status display
   */
  scheduledPaymentStatus(status: ScheduledPaymentStatusEnum): string {
    switch (status) {
      case ScheduledPaymentStatusEnum.OPEN:
        return this.i18n('Open');
      case ScheduledPaymentStatusEnum.BLOCKED:
        return this.i18n('Blocked');
      case ScheduledPaymentStatusEnum.CANCELED:
        return this.i18n('Canceled');
      case ScheduledPaymentStatusEnum.CLOSED:
        return this.i18n('Closed');
    }
  }

  /**
   * Returns the recurring payment status display
   */
  recurringPaymentStatus(status: RecurringPaymentStatusEnum): string {
    switch (status) {
      case RecurringPaymentStatusEnum.OPEN:
        return this.i18n('Open');
      case RecurringPaymentStatusEnum.CANCELED:
        return this.i18n('Canceled');
      case RecurringPaymentStatusEnum.CLOSED:
        return this.i18n('Closed');
    }
  }

  /**
   * Returns the recurring payment status display
   */
  paymentRequestStatus(status: PaymentRequestStatusEnum): string {
    switch (status) {
      case PaymentRequestStatusEnum.CANCELED:
        return this.i18n('Canceled');
      case PaymentRequestStatusEnum.DENIED:
        return this.i18n('Denied');
      case PaymentRequestStatusEnum.EXPIRED:
        return this.i18n('Expired');
      case PaymentRequestStatusEnum.OPEN:
        return this.i18n('Open');
      case PaymentRequestStatusEnum.SCHEDULED:
        return this.i18n('Scheduled');
      case PaymentRequestStatusEnum.PROCESSED:
        return this.i18n('Processed');
    }
  }

  /**
   * Returns the ticket status display
   */
  ticketStatus(status: TicketStatusEnum): string {
    switch (status) {
      case TicketStatusEnum.CANCELED:
        return this.i18n('Canceled');
      case TicketStatusEnum.EXPIRED:
        return this.i18n('Expired');
      case TicketStatusEnum.OPEN:
        return this.i18n('Open');
      case TicketStatusEnum.APPROVED:
        return this.i18n('Approved');
      case TicketStatusEnum.PROCESSED:
        return this.i18n('Processed');
    }
  }

  /**
   * Returns the external payment status display
   */
  externalPaymentStatus(status: ExternalPaymentStatusEnum): string {
    switch (status) {
      case ExternalPaymentStatusEnum.CANCELED:
        return this.i18n('Canceled');
      case ExternalPaymentStatusEnum.PENDING:
        return this.i18n('Pending');
      case ExternalPaymentStatusEnum.EXPIRED:
        return this.i18n('Expired');
      case ExternalPaymentStatusEnum.FAILED:
        return this.i18n('Failed');
      case ExternalPaymentStatusEnum.PROCESSED:
        return this.i18n('Processed');
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
        return this.i18n('Blocked');
      case ScheduledPaymentInstallmentStatusEnum.CANCELED:
        return this.i18n('Canceled');
      case ScheduledPaymentInstallmentStatusEnum.FAILED:
        return this.i18n('Failed');
      case ScheduledPaymentInstallmentStatusEnum.PROCESSED:
        return this.i18n('Processed');
      case ScheduledPaymentInstallmentStatusEnum.SCHEDULED:
        return this.i18n('Scheduled');
      case ScheduledPaymentInstallmentStatusEnum.SETTLED:
        return this.i18n('Settled');
    }
  }

  /**
   * Returns the display for the given recurring payment occurrence status
   */
  occurrenceStatus(status: RecurringPaymentOccurrenceStatusEnum): string {
    switch (status) {
      case RecurringPaymentOccurrenceStatusEnum.FAILED:
        return this.i18n('Failed');
      case RecurringPaymentOccurrenceStatusEnum.PROCESSED:
        return this.i18n('Processed');
    }
  }


}

