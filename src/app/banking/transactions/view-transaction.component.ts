import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  CustomFieldDetailed, CustomFieldTypeEnum, RecurringPaymentOccurrenceStatusEnum,
  RecurringPaymentOccurrenceView, ScheduledPaymentInstallmentStatusEnum,
  ScheduledPaymentInstallmentView, TransactionKind, TransactionView
} from 'app/api/models';
import { TransactionsService, TransfersService } from 'app/api/services';
import { PendingPaymentsService } from 'app/api/services/pending-payments.service';
import { RecurringPaymentsService } from 'app/api/services/recurring-payments.service';
import { ScheduledPaymentsService } from 'app/api/services/scheduled-payments.service';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/shared/base-page.component';
import { empty } from 'app/shared/helper';

/**
 * Displays a transaction details
 */
@Component({
  selector: 'view-transaction',
  templateUrl: 'view-transaction.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewTransactionComponent extends BasePageComponent<TransactionView> implements OnInit {

  title: string;
  lastAuthComment: string;
  hasDueAmount = false;
  hasInstallmentActions = false;

  constructor(
    injector: Injector,
    private transactionsService: TransactionsService,
    private transactionStatusService: TransactionStatusService,
    private pendingPaymentsService: PendingPaymentsService,
    private scheduledPaymentsService: ScheduledPaymentsService,
    private recurringPaymentsService: RecurringPaymentsService,
    private transfersService: TransfersService
  ) {
    super(injector);
  }

  get status(): string {
    return this.transactionStatusService.transactionStatus(this.transaction);
  }

  get transaction(): TransactionView {
    return this.data;
  }

  get key(): string {
    return this.route.snapshot.paramMap.get('key');
  }

  ngOnInit() {
    super.ngOnInit();
    this.transactionsService.viewTransaction({ key: this.key })
      .subscribe(transaction => {
        this.title = this.initTitle(transaction.kind);
        this.headingActions = this.initActions(transaction);
        this.hasDueAmount = transaction.dueAmount && !this.format.isZero(transaction.dueAmount);
        this.hasInstallmentActions = !!(transaction.installments || []).find(i => i.canProcess || i.canSettle);
        this.data = transaction;
        if (transaction.transfer) {
          transaction.transfer.transaction = transaction;
        }
        if (!empty(transaction.authorizations)) {
          this.lastAuthComment = transaction.authorizations[0].comments;
        }
      });
  }

  private initActions(transaction: TransactionView): HeadingAction[] {
    const actions: HeadingAction[] = [this.printAction];
    const auth = transaction.authorizationPermissions || {};
    if (!empty(transaction.authorizations)) {
      actions.push(new HeadingAction('check_circle_outline', this.messages.transaction.viewAuthorizations, () => {
        this.router.navigate(['banking', 'transaction', this.key, 'authorization-history']);
      }));
    }
    if (auth.authorize) {
      actions.push(new HeadingAction('thumb_up', this.messages.transaction.authorizePending, () => {
        this.authorize();
      }));
    }
    if (auth.deny) {
      actions.push(new HeadingAction('thumb_down', this.messages.transaction.denyPending, () => {
        this.deny();
      }));
    }
    if (auth.cancel) {
      actions.push(new HeadingAction('cancel', this.messages.transaction.cancelAuthorization, () => {
        this.cancelAuthorization();
      }));
    }

    const scheduled = transaction.scheduledPaymentPermissions || {};
    if (scheduled.block) {
      actions.push(new HeadingAction('block', this.messages.transaction.blockScheduling, () => {
        this.blockScheduled();
      }));
    }
    if (scheduled.unblock) {
      actions.push(new HeadingAction('schedule', this.messages.transaction.cancelScheduled, () => {
        this.unblockScheduled();
      }));
    }
    if (scheduled.cancel) {
      actions.push(new HeadingAction('cancel', this.messages.transaction.cancelScheduled, () => {
        this.cancelScheduled();
      }));
    }
    if (scheduled.settle) {
      actions.push(new HeadingAction('done_all', this.messages.transaction.settleScheduled, () => {
        this.settleScheduled();
      }));
    }

    const recurring = transaction.recurringPaymentPermissions || {};
    if (recurring.cancel) {
      actions.push(new HeadingAction('cancel', this.messages.transaction.cancelRecurring, () => {
        this.cancelRecurring();
      }));
    }

    if ((transaction.transfer || {}).canChargeback) {
      actions.push(new HeadingAction('undo', this.messages.transaction.chargebackTransfer, () => {
        this.chargeback();
      }));
    }
    return actions;
  }

  private get authorizationFields(): CustomFieldDetailed[] {
    return [{
      internalName: 'comments',
      name: this.messages.general.comments,
      type: CustomFieldTypeEnum.TEXT
    }];
  }

  private authorize() {
    this.notification.confirm({
      title: this.messages.transaction.authorizePending,
      labelPosition: 'above',
      customFields: this.authorizationFields,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.pendingPaymentsService.authorizePendingPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword,
          body: {
            comments: res.customValues.comments
          }
        }).subscribe(nextLevel => {
          if (nextLevel) {
            this.notification.warning(this.messages.transaction.authorizePendingDoneStillPending);
          } else {
            this.notification.snackBar(this.messages.transaction.authorizePendingDone);
          }
          this.reload();
        });
      }
    });
  }

  private deny() {
    this.notification.confirm({
      title: this.messages.transaction.denyPending,
      labelPosition: 'above',
      customFields: this.authorizationFields,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.pendingPaymentsService.denyPendingPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword,
          body: {
            comments: res.customValues.comments
          }
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.denyPendingDone);
          this.reload();
        });
      }
    });
  }

  private cancelAuthorization() {
    this.notification.confirm({
      title: this.messages.transaction.cancelAuthorization,
      labelPosition: 'above',
      customFields: this.authorizationFields,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.pendingPaymentsService.cancelPendingPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword,
          body: {
            comments: res.customValues.comments
          }
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.cancelAuthorizationDone);
          this.reload();
        });
      }
    });
  }

  private blockScheduled() {
    this.notification.confirm({
      title: this.messages.transaction.blockScheduling,
      message: this.messages.transaction.blockSchedulingMessage,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.blockScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.blockSchedulingDone);
          this.reload();
        });
      }
    });
  }

  private unblockScheduled() {
    this.notification.confirm({
      title: this.messages.transaction.unblockScheduling,
      message: this.messages.transaction.unblockSchedulingMessage,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.unblockScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.unblockSchedulingDone);
          this.reload();
        });
      }
    });
  }

  private cancelScheduled() {
    this.notification.confirm({
      title: this.messages.transaction.cancelScheduled,
      message: this.messages.transaction.cancelScheduledMessage,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.cancelScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.cancelScheduledDone);
          this.reload();
        });
      }
    });
  }

  private settleScheduled() {
    this.notification.confirm({
      title: this.messages.transaction.settleScheduled,
      message: this.messages.transaction.settleScheduledMessage,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.settleScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.settleScheduledDone);
          this.reload();
        });
      }
    });
  }

  private cancelRecurring() {
    this.notification.confirm({
      title: this.messages.transaction.cancelRecurring,
      message: this.messages.transaction.cancelRecurringMessage,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.recurringPaymentsService.cancelRecurringPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.cancelRecurringDone);
          this.reload();
        });
      }
    });
  }

  private chargeback() {
    this.notification.confirm({
      title: this.messages.transaction.chargebackTransfer,
      message: this.messages.transaction.chargebackTransferMessage,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.transfersService.chargebackTransfer({
          key: this.transaction.transfer.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.chargebackTransferDone);
          this.reload();
        });
      }
    });
  }

  private initTitle(kind: TransactionKind) {
    switch (kind) {
      case TransactionKind.SCHEDULED_PAYMENT:
        return this.messages.transaction.title.detailsScheduled;
      case TransactionKind.RECURRING_PAYMENT:
        return this.messages.transaction.title.detailsRecurring;
      case TransactionKind.PAYMENT_REQUEST:
        return this.messages.transaction.title.detailsRequest;
      case TransactionKind.CHARGEBACK:
        return this.messages.transaction.title.detailsChargeback;
      case TransactionKind.TICKET:
        return this.messages.transaction.title.detailsTicket;
      case TransactionKind.EXTERNAL_PAYMENT:
        return this.messages.transaction.title.detailsExternal;
      default:
        return this.messages.transaction.title.detailsPayment;
    }
  }

  installmentStatus(status: ScheduledPaymentInstallmentStatusEnum): string {
    return this.transactionStatusService.installmentStatus(status);
  }

  occurrenceStatus(status: RecurringPaymentOccurrenceStatusEnum): string {
    return this.transactionStatusService.occurrenceStatus(status);
  }

  path(row: ScheduledPaymentInstallmentView | RecurringPaymentOccurrenceView) {
    const key = row.transactionNumber || row.transferId;
    if (key) {
      return ['/banking', 'transfer', key];
    }
  }

  settleInstallment(installment: ScheduledPaymentInstallmentView) {
    this.notification.confirm({
      title: this.messages.transaction.settleInstallment,
      message: this.messages.transaction.settleInstallmentMessage(String(installment.number)),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.settleScheduledPaymentInstallment({
          id: installment.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.settleInstallmentDone);
          this.reload();
        });
      }
    });
  }

  processInstallment(installment: ScheduledPaymentInstallmentView) {
    this.notification.confirm({
      title: this.messages.transaction.processInstallment,
      message: this.messages.transaction.processInstallmentMessage(installment.number),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.processScheduledPaymentInstallment({
          id: installment.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.processInstallmentDone);
          this.reload();
        });
      }
    });
  }

  processOcurrence(occurrence: RecurringPaymentOccurrenceView) {
    this.notification.confirm({
      title: this.messages.transaction.processFailedOccurrence,
      message: this.messages.transaction.processFailedOccurrenceMessage(String(occurrence.number)),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.recurringPaymentsService.processFailedRecurringPaymentOccurrence({
          id: occurrence.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.messages.transaction.processFailedOccurrenceDone);
          this.reload();
        });
      }
    });
  }
}
