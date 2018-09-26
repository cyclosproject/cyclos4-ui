import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  RecurringPaymentOccurrenceView, RecurringPaymentOccurrenceStatusEnum,
  ScheduledPaymentInstallmentView, ScheduledPaymentInstallmentStatusEnum,
  TransactionKind, TransactionView, AvailabilityEnum, CustomFieldDetailed, CustomFieldTypeEnum
} from 'app/api/models';
import { TransactionsService, TransfersService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { Action } from 'app/shared/action';
import { PendingPaymentsService } from 'app/api/services/pending-payments.service';
import { ScheduledPaymentsService } from 'app/api/services/scheduled-payments.service';
import { RecurringPaymentsService } from 'app/api/services/recurring-payments.service';


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
  actions: Action[];
  hasDueAmount = false;
  hasInstallmentActions = false;
  hasOccurrenceActions = false;

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

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.transactionsService.viewTransaction({ key: key })
      .subscribe(transaction => {
        this.title = this.initTitle(transaction.kind);
        this.actions = this.initActions(transaction);
        this.hasDueAmount = transaction.dueAmount && !this.format.isZero(transaction.dueAmount);
        this.hasInstallmentActions = (transaction.installments || []).filter(i => i.canProcess || i.canSettle).length > 0;
        this.hasOccurrenceActions = (transaction.occurrences || []).filter(o => o.canProcess).length > 0;
        this.data = transaction;
      });
  }

  private initActions(transaction: TransactionView): Action[] {
    const actions: Action[] = [];
    const auth = transaction.authorizationPermissions || {};
    if (auth.authorize) {
      actions.push(new Action('thumb_up', this.i18n('Authorize'), () => {
        this.authorize();
      }));
    }
    if (auth.deny) {
      actions.push(new Action('thumb_down', this.i18n('Deny'), () => {
        this.deny();
      }));
    }
    if (auth.authorize) {
      actions.push(new Action('cancel', this.i18n('Cancel'), () => {
        this.cancelAuthorization();
      }));
    }

    const scheduled = transaction.scheduledPaymentPermissions || {};
    if (scheduled.block) {
      actions.push(new Action('block', this.i18n('Block'), () => {
        this.blockScheduled();
      }));
    }
    if (scheduled.unblock) {
      actions.push(new Action('schedule', this.i18n('Unblock'), () => {
        this.unblockScheduled();
      }));
    }
    if (scheduled.cancel) {
      actions.push(new Action('cancel', this.i18n('Cancel'), () => {
        this.cancelScheduled();
      }));
    }
    if (scheduled.settle) {
      actions.push(new Action('done_all', this.i18n('Settle'), () => {
        this.settleScheduled();
      }));
    }

    const recurring = transaction.recurringPaymentPermissions || {};
    if (recurring.cancel) {
      actions.push(new Action('cancel', this.i18n('Cancel'), () => {
        this.cancelRecurring();
      }));
    }

    if ((transaction.transfer || {}).canChargeback) {
      actions.push(new Action('undo', this.i18n('Chargeback'), () => {
        this.chargeback();
      }));
    }
    if ((transaction.transfer || {}).chargedBackBy) {
      actions.push(new Action('view', this.i18n('View chargeback'), () => {
        this.router.navigate(['/banking', 'transfer', ApiHelper.transactionNumberOrId(transaction.transfer.chargedBackBy)]);
      }));
    }
    return actions;
  }

  private get authorizationFields(): CustomFieldDetailed[] {
    return [{
      internalName: 'comments',
      name: this.i18n('Comments'),
      type: CustomFieldTypeEnum.TEXT
    }];
  }

  private authorize() {
    this.notification.confirm({
      title: this.i18n('Authorize payment'),
      labelPosition: 'above',
      customFields: this.authorizationFields,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.pendingPaymentsService.authorizePendingPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword,
          params: {
            comments: res.customValues.comments
          }
        }).subscribe(nextLevel => {
          if (nextLevel) {
            this.notification.warning(this.i18n('The payment still needs another authorization in order to be processed'));
          } else {
            this.notification.snackBar(this.i18n('The payment was authorized'));
          }
          this.reload();
        });
      }
    });
  }

  private deny() {
    this.notification.confirm({
      title: this.i18n('Deny payment'),
      labelPosition: 'above',
      customFields: this.authorizationFields,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.pendingPaymentsService.denyPendingPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword,
          params: {
            comments: res.customValues.comments
          }
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('The payment was denied'));
          this.reload();
        });
      }
    });
  }

  private cancelAuthorization() {
    this.notification.confirm({
      title: this.i18n('Cancel authorization'),
      labelPosition: 'above',
      customFields: this.authorizationFields,
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.pendingPaymentsService.cancelPendingPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword,
          params: {
            comments: res.customValues.comments
          }
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('The payment authorization was canceled'));
          this.reload();
        });
      }
    });
  }

  private blockScheduled() {
    this.notification.confirm({
      title: this.i18n('Block scheduling'),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.blockScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('The scheduling for this payment is now blocked'));
          this.reload();
        });
      }
    });
  }

  private unblockScheduled() {
    this.notification.confirm({
      title: this.i18n('Unblock scheduling'),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.unblockScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('The scheduling for this payment is now unblocked'));
          this.reload();
        });
      }
    });
  }

  private cancelScheduled() {
    this.notification.confirm({
      title: this.i18n('Cancel scheduled payment'),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.cancelScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('This scheduled payment has been canceled'));
          this.reload();
        });
      }
    });
  }

  private settleScheduled() {
    this.notification.confirm({
      title: this.i18n('Settle scheduled payment'),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.settleScheduledPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('All remaining installments have been settled'));
          this.reload();
        });
      }
    });
  }

  private cancelRecurring() {
    this.notification.confirm({
      title: this.i18n('Cancel recurring payment'),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.recurringPaymentsService.cancelRecurringPayment({
          key: this.transaction.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('This recurring payment has been canceled'));
          this.reload();
        });
      }
    });
  }

  private chargeback() {
    this.notification.confirm({
      title: this.i18n('Chargeback payment'),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.transfersService.chargebackTransfer({
          key: this.transaction.transfer.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('This payment was charged back'));
          this.reload();
        });
      }
    });
  }

  private initTitle(kind: TransactionKind) {
    switch (kind) {
      case TransactionKind.SCHEDULED_PAYMENT:
        return this.i18n('Scheduled payment details');
      case TransactionKind.RECURRING_PAYMENT:
        return this.i18n('Recurring payment details');
      case TransactionKind.PAYMENT_REQUEST:
        return this.i18n('Payment request details');
      case TransactionKind.CHARGEBACK:
        return this.i18n('Chargeback details');
      case TransactionKind.TICKET:
        return this.i18n('Ticket details');
      case TransactionKind.EXTERNAL_PAYMENT:
        return this.i18n('External payment details');
      default:
        return this.i18n('Payment details');
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
      title: this.i18n('Settle installment'),
      message: this.i18n('Are you sure to settle the installment number {{number}}?', {
        number: installment.number
      }),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.settleScheduledPaymentInstallment({
          id: installment.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('The installment was settled'));
          this.reload();
        });
      }
    });
  }

  processInstallment(installment: ScheduledPaymentInstallmentView) {
    this.notification.confirm({
      title: this.i18n('Process installment'),
      message: this.i18n('Are you sure to process now the installment number {{number}}?', {
        number: installment.number
      }),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.scheduledPaymentsService.processScheduledPaymentInstallment({
          id: installment.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('The installment was processed'));
          this.reload();
        });
      }
    });
  }

  processOcurrence(occurrence: RecurringPaymentOccurrenceView) {
    this.notification.confirm({
      title: this.i18n('Process failed occurrence'),
      message: this.i18n('Are you sure to process now the occurrence number {{number}}?', {
        number: occurrence.number
      }),
      passwordInput: this.transaction.confirmationPasswordInput,
      callback: res => {
        this.recurringPaymentsService.processFailedRecurringPaymentOccurrence({
          id: occurrence.id,
          confirmationPassword: res.confirmationPassword
        }).subscribe(() => {
          this.notification.snackBar(this.i18n('The occurrence was processed'));
          this.reload();
        });
      }
    });
  }
}
