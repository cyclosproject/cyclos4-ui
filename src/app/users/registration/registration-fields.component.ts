import { Component, Injector, ChangeDetectionStrategy, Input } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { UserDataForNew, GeographicalCoordinate } from 'app/api/models';
import { FormGroup } from '@angular/forms';
import { AvailabilityEnum } from 'app/api/models/availability-enum';
import { AddressFieldEnum } from 'app/api/models/address-field-enum';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';
import { Observable } from 'rxjs';
import { Country } from 'app/api/models/country';
import { BehaviorSubject } from 'rxjs';
import { MapsService } from 'app/core/maps.service';
import { debounceTime } from 'rxjs/operators';

/**
 * Provides the input for user fields
 */
@Component({
  selector: 'registration-fields',
  templateUrl: 'registration-fields.component.html',
  styleUrls: ['registration-fields.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrationFieldsComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private countriesResolve: CountriesResolve,
    public maps: MapsService) {
    super(injector);
  }

  @Input()
  form: FormGroup;

  @Input()
  addressForm: FormGroup;

  @Input()
  data: UserDataForNew;

  location = new BehaviorSubject<GeographicalCoordinate>(null);

  ngOnInit() {
    super.ngOnInit();
    if (this.maps.enabled) {
      this.subscriptions.push(this.location.subscribe(loc =>
        this.addressForm.patchValue({ location: loc })));
      this.subscriptions.push(this.addressForm.valueChanges.pipe(
        debounceTime(ApiHelper.DEBOUNCE_TIME)
      ).subscribe(value => {
        // Only attempt to geocode if there is at least the address line 1 or street name
        if (value.addressLine1 || value.street) {
          const fields: string[] = [];
          for (const field of this.data.addressConfiguration.enabledFields) {
            if (field === AddressFieldEnum.COMPLEMENT || field === AddressFieldEnum.PO_BOX) {
              // These fields are not useful for geocoding
              continue;
            }
            fields.push(value[field]);
          }
          this.subscriptions.push(this.maps.geocode(fields).subscribe(loc => {
            this.location.next(loc);
          }));
        } else {
          this.location.next(null);
        }
      }));
    }
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
    return ApiHelper.addressFieldLabel(field, this.messages);
  }

  get optionalAddress(): boolean {
    return this.data.addressConfiguration.availability === AvailabilityEnum.OPTIONAL;
  }
}
