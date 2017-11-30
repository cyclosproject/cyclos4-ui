import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { PaymentKindAndIdMethod } from 'app/banking/payments/payment-kind-and-id-method';

/**
 * Provides the selection of the payment kind
 */
@Component({
  selector: 'payment-kind',
  templateUrl: 'payment-kind.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentKindComponent extends BaseBankingComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  kindForm: FormGroup;

  @Input()
  allowedKindAndIdMethods: PaymentKindAndIdMethod[];
}
