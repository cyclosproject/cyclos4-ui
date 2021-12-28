import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction, TransactionAuthorizationStatusEnum } from 'app/api/models';
import { PaymentComponent } from 'app/ui/banking/payment/payment.component';
import { BaseComponent } from 'app/shared/base.component';
import { Enter } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Payment final step
 */
@Component({
  selector: 'payment-step-done',
  templateUrl: 'payment-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentStepDoneComponent extends BaseComponent implements OnInit {

  @Input() performed: Transaction;
  icon: SvgIcon;
  message: string;

  constructor(
    injector: Injector,
    private performPayment: PaymentComponent) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.performed.authorizationStatus === TransactionAuthorizationStatusEnum.PENDING) {
      this.icon = SvgIcon.CalendarEvent;
      this.message = this.performed.transactionNumber
        ? this.i18n.transaction.pendingWithNumber(this.performed.transactionNumber)
        : this.i18n.transaction.pending;
    } else {
      this.icon = SvgIcon.Check2;
      this.message = this.performed.transactionNumber
        ? this.i18n.transaction.processedWithNumber(this.performed.transactionNumber)
        : this.i18n.transaction.processed;
    }
    this.addShortcut(Enter, () => this.performPayment.viewPerformed());
  }

}
