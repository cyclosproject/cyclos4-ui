import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PaymentPreview, TransferFeePreview } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';


/**
 * Payment step: confirm the payment
 */
@Component({
  selector: 'payment-step-confirm',
  templateUrl: 'payment-step-confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentStepConfirmComponent extends BaseComponent implements OnInit {

  @Input() preview: PaymentPreview;
  @Input() confirmationPassword: FormControl;
  @Input() showPaymentType: boolean;
  fees: TransferFeePreview[];

  form: FormGroup;

  constructor(
    injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.form = this.formBuilder.group({});
    this.form.setControl('confirmationPassword', this.confirmationPassword);
    this.fees = this.preview.fees;
    if (empty(this.fees) && (this.preview.installments || []).length === 1) {
      // Show the preview of the single installment instead
      this.fees = this.preview.installments[0].fees;
    }
  }

}
