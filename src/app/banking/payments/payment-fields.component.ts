import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { PerformPayment, TransactionTypeData } from "app/api/models";
import { FormGroup } from '@angular/forms';

/**
 * Provides the selection of the payment type
 */
@Component({
  selector: 'payment-fields',
  templateUrl: 'payment-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentFieldsComponent extends BaseBankingComponent {
  constructor(injector: Injector) {
    super(injector);
  }

  @Input()
  fieldsForm: FormGroup;

  @Input()
  paymentTypeData: TransactionTypeData;
}