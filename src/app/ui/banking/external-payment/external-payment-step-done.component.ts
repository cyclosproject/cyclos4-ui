import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction } from 'app/api/models';
import { Enter } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { BaseComponent } from 'app/shared/base.component';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';

/**
 * Pay external user: final step
 */
@Component({
  selector: 'external-payment-step-done',
  templateUrl: 'external-payment-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalPaymentStepDoneComponent extends BaseComponent implements OnInit {

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
    this.icon = SvgIcon.Check2;
    this.message = this.performed.transactionNumber
      ? this.i18n.transaction.externalPaymentPerformedWithNumber(this.performed.transactionNumber)
      : this.i18n.transaction.externalPaymentPerformed;
    this.addShortcut(Enter,
      () => this.router.navigate(['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(this.performed)]));
  }

}
