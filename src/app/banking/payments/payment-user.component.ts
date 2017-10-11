import { Component, Injector, Provider, forwardRef, ChangeDetectionStrategy, ViewChild, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";
import { BaseBankingComponent } from "app/banking/base-banking.component";
import { DataForTransaction, IdentificationMethodEnum, UserDataForSearch, User } from "app/api/models";
import { UsersService, ContactsService } from "app/api/services";
import { ApiHelper } from "app/shared/api-helper";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { IdMethod } from "app/banking/payments/id-method";

// Definition of the exported NG_VALUE_ACCESSOR provider
export const PAYMENT_USER_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => PaymentUserComponent),
  multi: true
};

/**
 * Provides the selection of the user that will receive the payment
 */
@Component({
  selector: 'payment-user',
  templateUrl: 'payment-user.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PAYMENT_USER_VALUE_ACCESSOR]
})
export class PaymentUserComponent extends BaseBankingComponent implements ControlValueAccessor {
  constructor(
    injector: Injector,
    private usersService: UsersService,
    private contactsService: ContactsService) {
    super(injector);
  }

  @Input()
  public idMethod: IdMethod;

  public dataForSearch = new BehaviorSubject<UserDataForSearch>(null);
  public contacts = new BehaviorSubject<User[]>(null);

  get isSearch(): boolean {
    return this.idMethod != null
      && this.idMethod.internalName == IdentificationMethodEnum.AUTOCOMPLETE;
  }

  get isContacts(): boolean {
    return this.idMethod != null
      && this.idMethod.internalName == IdentificationMethodEnum.CONTACTS;
  }

  get isPrincipal(): boolean {
    return this.idMethod != null 
      && this.idMethod.internalName != IdentificationMethodEnum.AUTOCOMPLETE
      && this.idMethod.internalName != IdentificationMethodEnum.CONTACTS;
  }

  private _value: string
  get value(): string {
    return this._value;
  }
  set value(val: string) {
    this._value = val;
    this.changeCallback(val);
  }

  private changeCallback = (_: any) => { };
  private touchedCallback = () => { };

  ngOnInit() {
    super.ngOnInit();
    if (this.isSearch) {
      this.usersService.getUserDataForSearch()
        .then(response => {
          this.dataForSearch.next(response.data);
        });
    } else if (this.isContacts) {
      this.contactsService.searchContacts({
        user: ApiHelper.SELF,
        pageSize: 9999
      })
        .then(response => {
          this.contacts.next(response.data);
        });
    }
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
