import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction, TransactionAuthorizationStatusEnum, TransactionKind } from 'app/api/models';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { Enter } from 'app/core/shortcut.service';

/**
 * Send and accept payment request final step
 */
@Component({
  selector: 'request-payment-step-done',
  templateUrl: 'request-payment-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestPaymentStepDoneComponent extends BaseComponent implements OnInit {

  @Input() performed: Transaction;
  @Input() processDate: string;
  icon: string;
  message: string;

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    let addShortcut = true;
    if (this.performed?.kind === TransactionKind.PAYMENT_REQUEST) {
      this.icon = 'done';
      this.message = this.performed.kind
        ? this.i18n.transaction.processedPaymentRequestWithNumber(this.performed.transactionNumber)
        : this.i18n.transaction.processedPaymentRequest;
    } else {
      if (this.performed?.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING) {
        this.icon = 'scheduled';
        this.message = this.performed.transactionNumber
          ? this.i18n.transaction.pendingWithNumber(this.performed.transactionNumber)
          : this.i18n.transaction.pending;
      } else if (this.performed) {
        this.icon = 'done';
        this.message = this.performed.transactionNumber
          ? this.i18n.transaction.processedWithNumber(this.performed.transactionNumber)
          : this.i18n.transaction.processed;
      } else {
        this.icon = 'scheduled';
        this.message = this.i18n.transaction.acceptedScheduledPaymentRequest(this.processDate);
        addShortcut = false;
      }
    }
    if (addShortcut) {
      this.addShortcut(Enter,
        () => this.router.navigate(['banking', 'transaction', this.bankingHelper.transactionNumberOrId(this.performed)]));
    }
  }

}
