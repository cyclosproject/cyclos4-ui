import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseUsersComponent } from 'app/users/base-users.component';
import { UserDataForNew } from 'app/api/models';
import { FormGroup } from '@angular/forms';
import { AvailabilityEnum } from 'app/api/models/availability-enum';
import { AddressFieldEnum } from 'app/api/models/address-field-enum';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';
import { Observable } from 'rxjs/Observable';
import { Country } from 'app/api/models/country';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { getAllErrors } from 'app/shared/helper';

/**
 * Provides the input for user fields
 */
@Component({
  selector: 'registration-fields',
  templateUrl: 'registration-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationFieldsComponent extends BaseUsersComponent {
  constructor(
    injector: Injector,
    private countriesResolve: CountriesResolve) {
    super(injector);
  }

  @Input()
  counter: BehaviorSubject<number>;

  @Input()
  form: FormGroup;

  @Input()
  data: UserDataForNew;

  ngOnInit() {
    super.ngOnInit();
    this.subscriptions.push(this.form.statusChanges.subscribe(st => {
      this.detectChanges();
    }));
  }

  get hasName(): boolean {
    return this.canEdit('name');
  }

  get hasUsername(): boolean {
    return this.canEdit('name') && !this.data.generatedUsername;
  }

  get hasEmail(): boolean {
    return this.canEdit('email');
  }

  get hasLandLinePhone(): boolean {
    return this.data.phoneConfiguration.landLineAvailability !== AvailabilityEnum.DISABLED;
  }

  get hasExtension(): boolean {
    return this.data.phoneConfiguration.extensionEnabled;
  }

  get hasMobilePhone(): boolean {
    return this.data.phoneConfiguration.mobileAvailability !== AvailabilityEnum.DISABLED;
  }

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
    return ApiHelper.addressFieldLabel(field, this.usersMessages);
  }

  get optionalAddress(): boolean {
    return this.data.addressConfiguration.availability === AvailabilityEnum.OPTIONAL;
  }

  managePrivacy(field: string): boolean {
    const actions = this.data.profileFieldActions[field];
    return actions != null && actions.managePrivacy;
  }

  private canEdit(field: string): boolean {
    const actions = this.data.profileFieldActions[field];
    return actions && actions.edit;
  }

  get errors() {
    return getAllErrors(this.form);
  }
}
