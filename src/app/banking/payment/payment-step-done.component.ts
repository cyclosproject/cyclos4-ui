import { Component, ChangeDetectionStrategy, Injector, OnInit, Input } from '@angular/core';

import { PaymentsService } from 'app/api/services';
import { Transaction } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { ApiHelper } from 'app/shared/api-helper';

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

  constructor(
    injector: Injector,
    private paymentsService: PaymentsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
  }

}
