import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction, TransactionView } from 'app/api/models';
import { Enter } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { BaseComponent } from 'app/shared/base.component';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';

/**
 * Final step after accepting a payment request
 */
@Component({
  selector: 'accept-payment-request-step-done',
  templateUrl: 'accept-payment-request-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptPaymentRequestStepDoneComponent extends BaseComponent implements OnInit {

  @Input() paymentRequest: TransactionView;
  @Input() performed: Transaction;
  @Input() processDate: string;
  icon: SvgIcon;
  message: string;

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.processDate) {
      this.icon = SvgIcon.CalendarEvent;
      this.message = this.paymentRequest.transactionNumber
        ? this.i18n.transaction.paymentRequestAcceptScheduledWithNumber({
          date: this.processDate,
          number: this.paymentRequest.transactionNumber
        })
        : this.i18n.transaction.paymentRequestAcceptScheduled(this.processDate);
    } else {
      this.icon = SvgIcon.Check2;
      this.message = this.performed.transactionNumber
        ? this.i18n.transaction.processedWithNumber(this.performed.transactionNumber)
        : this.i18n.transaction.processed;
    }
    this.addShortcut(Enter,
      () => this.router.navigate(['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(this.performed)]));
  }

}
