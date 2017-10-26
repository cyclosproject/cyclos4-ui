import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { TransferTypeWithCurrency } from "app/api/models";
import { FormGroup } from '@angular/forms';

/**
 * Provides the selection of the payment type
 */
@Component({
  selector: 'payment-type',
  templateUrl: 'payment-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentTypeComponent extends BaseBankingComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  typeForm: FormGroup;

  @Input()
  allowedPaymentTypes: TransferTypeWithCurrency[];
}