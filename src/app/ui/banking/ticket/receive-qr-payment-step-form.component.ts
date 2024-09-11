import { ChangeDetectionStrategy, Component, Injector, Input, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DataForTransaction, TransactionTypeData, TransferType } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';

/**
 * Receive QR payment step: the main payment form
 */
@Component({
  selector: 'receive-qr-payment-step-form',
  templateUrl: 'receive-qr-payment-step-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReceiveQrPaymentStepFormComponent extends BaseComponent {
  @Input() data: DataForTransaction;
  @Input() form: FormGroup;
  @Input() transferTypes: TransferType[];
  @Input() type: TransferType;
  @Input() typeData: TransactionTypeData;

  @ViewChild('amount', { static: true }) amountField: DecimalFieldComponent;

  constructor(injector: Injector) {
    super(injector);
  }

  get singleAccount(): boolean {
    return this.data.accounts.length === 1;
  }

  get currency() {
    return this.typeData == null ? null : this.typeData.currency;
  }
}
