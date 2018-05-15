import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { UserDataForNew } from 'app/api/models';
import { FormGroup } from '@angular/forms';
import { AvailabilityEnum } from 'app/api/models/availability-enum';
import { AddressFieldEnum } from 'app/api/models/address-field-enum';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';
import { Observable } from 'rxjs';
import { Country } from 'app/api/models/country';
import { BehaviorSubject } from 'rxjs';

/**
 * Provides the input for user fields
 */
@Component({
  selector: 'registration-fields',
  templateUrl: 'registration-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationFieldsComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private countriesResolve: CountriesResolve) {
    super(injector);
  }

  @Input()
  form: FormGroup;

  @Input()
  addressForm: FormGroup;

  @Input()
  data: UserDataForNew;

  get hasAddress(): boolean {
    return this.data.addressConfiguration.availability !== AvailabilityEnum.DISABLED;
  }

  get addressFields(): AddressFieldEnum[] {
    return this.data.addressConfiguration.enabledFields;
  }

  get countries(): Observable<Country[]> {
    return this.countriesResolve.data;
  }

  requiredAddressField(field: AddressFieldEnum): BehaviorSubject<boolean> {
    const required = this.data.addressConfiguration.requiredFields.includes(field);
    const subj = new BehaviorSubject(required && this.addressDefined);
    this.subscriptions.push(this.form.get('addressDefined').valueChanges.subscribe(defined => {
      subj.next(required && defined);
    }));
    return subj;
  }

  get addressDefined() {
    return this.form.value.addressDefined;
  }

  addressFieldLabel(field: AddressFieldEnum): string {
    return ApiHelper.addressFieldLabel(field, this.messages);
  }

  get optionalAddress(): boolean {
    return this.data.addressConfiguration.availability === AvailabilityEnum.OPTIONAL;
  }
}
