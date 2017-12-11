import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { TransactionTypeData, TransferTypeWithCurrency } from 'app/api/models';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Provides the selection of the payment type and filling of payment fields
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
  paymentTypes: TransferTypeWithCurrency[];

  @Input()
  paymentTypeData: BehaviorSubject<TransactionTypeData>;
}
