import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { PaymentKind } from "app/banking/payments/payment-kind";
import { MdRadioGroup } from "@angular/material";

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_KIND_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PaymentKindComponent),
  multi: true
};

/**
 * Provides the selection of the payment kind the user will perform
 */
@Component({
  selector: 'payment-kind',
  templateUrl: 'payment-kind.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_KIND_VALUE_ACCESSOR]
})
export class PaymentKindComponent extends BaseBankingComponent implements ControlValueAccessor {
  constructor(injector: Injector) {
    super(injector);
  }

  private _value: PaymentKind
  get value(): PaymentKind {
    return this._value;
  }
  set value(val: PaymentKind)  {
    this._value = val;
    this.changeCallback(val);
  }

  @Input()
  allowedKinds: PaymentKind[];

  kindLabels;
  
  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  @ViewChild("kindRadio")
  private kindRadioGroup: MdRadioGroup

  ngOnInit() {
    super.ngOnInit();

    this.kindLabels = {};
    this.kindLabels[PaymentKind.USER] = this.bankingMessages.paymentKindUser();
    this.kindLabels[PaymentKind.SELF] = this.bankingMessages.paymentKindSelf();
    this.kindLabels[PaymentKind.SYSTEM] = this.bankingMessages.paymentKindSystem();
  }

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
    this.kindRadioGroup.disabled = isDisabled;
  }
}