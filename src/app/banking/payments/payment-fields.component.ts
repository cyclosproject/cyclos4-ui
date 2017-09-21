import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { PerformPayment, TransactionTypeData } from "app/api/models";
import { cloneDeep } from "lodash";

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_FIELDS_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PaymentFieldsComponent),
  multi: true
};

/**
 * Provides the selection of the payment type
 */
@Component({
  selector: 'payment-fields',
  templateUrl: 'payment-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_FIELDS_VALUE_ACCESSOR]
})
export class PaymentFieldsComponent extends BaseBankingComponent implements ControlValueAccessor {
  constructor(injector: Injector) {
    super(injector);
  }

  get amount(): string {
    return this.payment ? this.payment.amount : null;
  }
  set amount(val: string) {
    this.notifyChange(false, 'amount', val);
  }

  get description(): string {
    return this.payment ?  this.payment.description : null;
  }
  set description(val: string) {
    this.notifyChange(false, 'description', val);
  }
  customValues = {};

  private payment: PerformPayment;

  @Input()
  paymentTypeData: TransactionTypeData;

  ngOnInit() {
    super.ngOnInit();
    for (let cf of this.paymentTypeData.customFields) {
      Object.defineProperty(this.customValues, cf.internalName, {
        get: () => this.payment ? this.payment.customValues[cf.internalName] : null,
        set: (val) => this.notifyChange(true, cf.internalName, val)
      });
    }
  }

  private notifyChange(customValue: boolean, prop: string, value: any) {
    this.payment = cloneDeep(this.payment || {customValues:{}});
    if (customValue) {
      this.payment.customValues[prop] = value;
    } else {
      this.payment[prop] = value;
    }
    this.changeCallback(this.payment);
  }

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  writeValue(obj: any): void {
    this.payment = obj
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