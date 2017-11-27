import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormGroup } from '@angular/forms';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { PaymentKind } from 'app/banking/payments/payment-kind';
import { MatRadioGroup } from '@angular/material';
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
