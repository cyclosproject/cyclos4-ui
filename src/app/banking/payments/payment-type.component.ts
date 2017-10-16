import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { MatRadioGroup } from "@angular/material";
import { TransferTypeWithCurrency } from "app/api/models";

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_TYPE_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PaymentTypeComponent),
  multi: true
};

/**
 * Provides the selection of the payment type
 */
@Component({
  selector: 'payment-type',
  templateUrl: 'payment-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_TYPE_VALUE_ACCESSOR]
})
export class PaymentTypeComponent extends BaseBankingComponent implements ControlValueAccessor {
  constructor(injector: Injector) {
    super(injector);
  }

  private _value: TransferTypeWithCurrency
  get value(): TransferTypeWithCurrency {
    return this._value;
  }
  set value(val: TransferTypeWithCurrency)  {
    this._value = val;
    this.changeCallback(val);
  }

  @Input()
  allowedPaymentTypes: TransferTypeWithCurrency[];

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  @ViewChild("paymentTypeRadio")
  private paymentTypeRadioGroup: MatRadioGroup

  writeValue(obj: any): void {
    this.value = obj
  }
  registerOnChange(fn: any): void {
    this.changeCallback = fn;
  }
  registerOnTouched(fn: any): void {
    this.touchedCallback = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.paymentTypeRadioGroup.disabled = isDisabled;
  }
}