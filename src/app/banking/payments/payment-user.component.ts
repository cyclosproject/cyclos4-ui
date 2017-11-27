import { Component, Injector, Provider, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BaseBankingComponent } from 'app/banking/base-banking.component';
import { IdentificationMethodEnum, UserDataForSearch, User } from 'app/api/models';
import { IdMethod } from 'app/banking/payments/id-method';

/**
 * Provides the selection of the user that will receive the payment
 */
@Component({
  selector: 'payment-user',
  templateUrl: 'payment-user.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentUserComponent extends BaseBankingComponent {
  constructor(
    injector: Injector) {
    super(injector);
  }

  @Input()
  userForm: FormGroup;

  @Input()
  idMethod: IdMethod;

  @Input()
  dataForSearch: UserDataForSearch;

  @Input()
  contacts: User[];

  get isSearch(): boolean {
    return this.idMethod.internalName === IdentificationMethodEnum.AUTOCOMPLETE;
  }

  get isContacts(): boolean {
    return this.idMethod.internalName === IdentificationMethodEnum.CONTACTS;
  }

  get isPrincipal(): boolean {
    return !this.isSearch && !this.isContacts;
  }

}
