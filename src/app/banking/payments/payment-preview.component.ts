import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { PaymentPreview, AccountKind } from 'app/api/models';
import { ModelHelper } from 'app/shared/model-helper';

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_PREVIEW_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PaymentPreviewComponent),
  multi: true
};

/**
 * Displays the payment preview and presents the confirmation password
 */
@Component({
  selector: 'payment-preview',
  templateUrl: 'payment-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_PREVIEW_VALUE_ACCESSOR]
})
export class PaymentPreviewComponent extends BaseBankingComponent implements ControlValueAccessor {
  constructor(
    injector: Injector) {
    super(injector);
  }

  @Input()
  preview: PaymentPreview;

  private _confirmationPassword: string
  get confirmationPassword(): string {
    return this._confirmationPassword;
  }
  set confirmationPassword(val: string) {
    this._confirmationPassword = val;
    this.changeCallback(val);
  }

  get from(): string {
    return ModelHelper.accountName(this.generalMessages, true,
      this.preview.fromAccount, this.preview.paymentType);
  }

  get to(): string {
    return ModelHelper.accountName(this.generalMessages, false,
      this.preview.toAccount, this.preview.paymentType);
  }

  get hasAmount(): boolean {
    return !this.hasTotalAmount;
  }
  get hasMainAmount(): boolean {
    return this.hasTotalAmount;
  }
  get hasTotalAmount(): boolean {
    return this.preview.mainAmount != this.preview.totalAmount
  }
  get hasFees(): boolean {
    return (this.preview.fees || []).length > 0;
  }
  get hasDescription(): boolean {
    return (this.preview.payment.description || '').length > 0;
  }

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  writeValue(obj: any): void {
    this.confirmationPassword = obj
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
  }
}
