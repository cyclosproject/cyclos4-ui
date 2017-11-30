import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { PaymentPreview } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup } from '@angular/forms';

/**
 * Displays the payment preview and presents the confirmation password
 */
@Component({
  selector: 'payment-preview',
  templateUrl: 'payment-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentPreviewComponent extends BaseBankingComponent {
  constructor(
    injector: Injector) {
    super(injector);
  }

  @Input()
  preview: PaymentPreview;

  @Input()
  previewForm: FormGroup;

  get from(): string {
    return ApiHelper.accountName(this.generalMessages, true,
      this.preview.fromAccount, this.preview.paymentType);
  }

  get to(): string {
    return ApiHelper.accountName(this.generalMessages, false,
      this.preview.toAccount, this.preview.paymentType);
  }

  get hasAmount(): boolean {
    return !this.hasTotalAmount;
  }
  get hasMainAmount(): boolean {
    return this.hasTotalAmount;
  }
  get hasTotalAmount(): boolean {
    return this.preview.mainAmount !== this.preview.totalAmount;
  }
  get hasFees(): boolean {
    return (this.preview.fees || []).length > 0;
  }
  get hasDescription(): boolean {
    return (this.preview.payment.description || '').length > 0;
  }

  get canConfirm(): boolean {
    return ApiHelper.canConfirm(this.preview.confirmationPasswordInput);
  }


}
