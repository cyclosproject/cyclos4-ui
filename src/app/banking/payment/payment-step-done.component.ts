import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transaction } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';


/**
 * Payment final step
 */
@Component({
  selector: 'payment-step-done',
  templateUrl: 'payment-step-done.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStepDoneComponent extends BaseComponent implements OnInit {

  @Input() performed: Transaction;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
  }

}
