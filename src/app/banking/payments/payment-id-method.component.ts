import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { DataForTransaction, PrincipalTypeInput, IdentificationMethodEnum, PrincipalTypeKind } from "app/api/models";
import { PaymentsService } from "app/api/services";
import { ModelHelper } from "app/shared/model-helper";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { IdMethod } from "app/banking/payments/id-method";

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_ID_METHOD_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PaymentIdMethodComponent),
  multi: true
};

/**
 * Provides the selection of the identification method used to select the user
 */
@Component({
  selector: 'payment-id-method',
  templateUrl: 'payment-id-method.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_ID_METHOD_VALUE_ACCESSOR]
})
export class PaymentIdMethodComponent extends BaseBankingComponent implements ControlValueAccessor {
  constructor(
    injector: Injector,
    private paymentsService: PaymentsService) {
    super(injector);
  }

  private _value: IdMethod
  get value(): IdMethod {
    return this._value;
  }
  set value(val: IdMethod) {
    this._value = val;
    this.changeCallback(val);
  }

  dataForPayment: BehaviorSubject<DataForTransaction> = new BehaviorSubject(null);
  allowedIdMethods: IdMethod[];

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  ngOnInit() {
    super.ngOnInit();
    let searchIdMethod = {
      internalName: IdentificationMethodEnum.AUTOCOMPLETE,
      name: this.bankingMessages.paymentIdMethodAutocomplete()
    };
    let contactsIdMethod = {
      internalName: IdentificationMethodEnum.CONTACTS,
      name: this.bankingMessages.paymentIdMethodContact()
    }

    this.paymentsService.dataForPerformPayment({ owner: ModelHelper.SELF })
      .then(response => {
        this.allowedIdMethods = [];
        let dp = response.data;
        if (dp.allowAutocomplete) {
          this.allowedIdMethods.push(searchIdMethod);
        }
        if (dp.allowContacts) {
          this.allowedIdMethods.push(contactsIdMethod);
        }
        var defaultPrincipalType = null;
        dp.principalTypes.forEach(pt => {
          if (pt.kind != PrincipalTypeKind.TOKEN || pt.allowManualInput) {
            // Only tokens with manual input are supported (no NFC tag / barcode scanning / etc)
            this.allowedIdMethods.push(pt);
            if (dp.defaultPrincipalType == pt.internalName) {
              defaultPrincipalType = pt;
            }
          }
        });

        // If not yet, initialize the value with the default
        if (this.value == null) {
          switch (dp.defaultIdMethod) {
            case IdentificationMethodEnum.AUTOCOMPLETE:
              this.value = searchIdMethod;
              break;
            case IdentificationMethodEnum.CONTACTS:
              this.value = contactsIdMethod;
              break;
            case IdentificationMethodEnum.PRINCIPAL_TYPE:
              this.value = defaultPrincipalType;
              break;
          }
        }

        this.dataForPayment.next(dp);
      });
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
  }
}
