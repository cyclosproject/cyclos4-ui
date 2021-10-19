import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction } from 'app/api/models';
import { Enter } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { BaseComponent } from 'app/shared/base.component';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';

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
  icon: SvgIcon;
  message: string;

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.icon = SvgIcon.Check2;
    this.message = this.performed.transactionNumber
      ? this.i18n.transaction.paymentRequestSentWithNumber(this.performed.transactionNumber)
      : this.i18n.transaction.paymentRequestSent;
    this.addShortcut(Enter,
      () => this.router.navigate(['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(this.performed)]));
  }

}
