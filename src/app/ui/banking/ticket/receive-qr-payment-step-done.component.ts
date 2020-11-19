import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction, TransactionAuthorizationStatusEnum } from 'app/api/models';
import { Enter } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { BaseComponent } from 'app/shared/base.component';
import { ReceiveQrPaymentComponent } from 'app/ui/banking/ticket/receive-qr-payment.component';

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
  icon: SvgIcon;
  message: string;

  constructor(
    injector: Injector,
    private receiveQrPayment: ReceiveQrPaymentComponent) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.payment.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING) {
      this.icon = SvgIcon.CalendarEvent;
      this.message = this.payment.transactionNumber
        ? this.i18n.transaction.pendingWithNumber(this.payment.transactionNumber)
        : this.i18n.transaction.pending;
    } else {
      this.icon = SvgIcon.Check2;
      this.message = this.payment.transactionNumber
        ? this.i18n.transaction.processedWithNumber(this.payment.transactionNumber)
        : this.i18n.transaction.processed;
    }
    this.addShortcut(Enter, () => this.receiveQrPayment.viewPerformed());
  }

}
