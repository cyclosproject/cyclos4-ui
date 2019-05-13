import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { Enter } from 'app/shared/shortcut.service';
import { PerformPaymentComponent } from 'app/banking/payment/perform-payment.component';


/**
 * Payment final step
 */
@Component({
  selector: 'payment-step-done',
  templateUrl: 'payment-step-done.component.html',
  styleUrls: ['payment-step-done.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStepDoneComponent extends BaseComponent implements OnInit {

  @Input() performed: Transaction;

  constructor(injector: Injector,
    private performPayment: PerformPaymentComponent) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addShortcut(Enter, () => this.performPayment.viewPerformed());
  }

}
