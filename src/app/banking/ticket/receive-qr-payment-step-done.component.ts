import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction, TransactionAuthorizationStatusEnum } from 'app/api/models';
import { ReceiveQrPaymentComponent } from 'app/banking/ticket/receive-qr-payment.component';
import { BaseComponent } from 'app/shared/base.component';
import { Enter } from 'app/shared/shortcut.service';

/**
 * Receive QR-code payment final step
 */
@Component({
  selector: 'receive-qr-payment-step-done',
  templateUrl: 'receive-qr-payment-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiveQrPaymentStepDoneComponent extends BaseComponent implements OnInit {

  @Input() payment: Transaction;
  icon: string;
  message: string;

  constructor(
    injector: Injector,
    private receiveQrPayment: ReceiveQrPaymentComponent) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.payment.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING) {
      this.icon = 'scheduled';
      this.message = this.payment.transactionNumber
        ? this.i18n.transaction.pendingWithNumber(this.payment.transactionNumber)
        : this.i18n.transaction.pending;
    } else {
      this.icon = 'done';
      this.message = this.payment.transactionNumber
        ? this.i18n.transaction.processedWithNumber(this.payment.transactionNumber)
        : this.i18n.transaction.processed;
    }
    this.addShortcut(Enter, () => this.receiveQrPayment.viewPerformed());
  }

}
