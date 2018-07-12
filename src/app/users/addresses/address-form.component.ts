import { Component, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { AddressesService } from 'app/api/services';
import { AddressDataForEdit, AddressDataForNew, AddressFieldEnum, GeographicalCoordinate } from 'app/api/models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { copyProperties } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';
import { debounceTime } from 'rxjs/operators';
import { MapsService } from '../../core/maps.service';

/**
 * Either create or edit a address
 */
@Component({
  selector: 'address-form',
  templateUrl: 'address-form.component.html',
  styleUrls: ['address-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent extends BaseComponent {

  form: FormGroup;
  id: string;
  title: string;
  managePrivacy = false;

  location = new BehaviorSubject<GeographicalCoordinate>(null);

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddressFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddressDataForNew | AddressDataForEdit,
    public countriesResolve: CountriesResolve,
    private addressesService: AddressesService,
    maps: MapsService) {
    super(injector);

    this.id = data['id'];
    const address = data.address;

    this.managePrivacy = (data as AddressDataForEdit).managePrivacy;
    if (this.id) {
      // Details
      this.title = this.messages.addressDetails();
    } else {
      // New
      this.title = this.messages.addressNew();
    }

    this.form = formBuilder.group({
      name: [address.name, Validators.required]
    });
    if (maps.enabled) {
      this.location.next(address.location);
      this.subscriptions.push(this.form.valueChanges.pipe(
        debounceTime(ApiHelper.DEBOUNCE_TIME)
      ).subscribe(value => {
        // Only attempt to geocode if there is at least the address line 1 or street name
        if (value.addressLine1 || value.street) {
          const fields: string[] = [];
          for (const field of data.enabledFields) {
            if (field === AddressFieldEnum.COMPLEMENT || field === AddressFieldEnum.PO_BOX) {
              // These fields are not useful for geocoding
              continue;
            }
            fields.push(value[field]);
          }
          this.subscriptions.push(maps.geocode(fields).subscribe(loc => {
            this.location.next(loc);
          }));
        } else {
          this.location.next(null);
        }
      }));
    }

    data.enabledFields.forEach(f => {
      const val = data.requiredFields.includes(f) ? Validators.required : null;
      this.form.setControl(f, formBuilder.control(address[f], val));
    });
    if (this.managePrivacy) {
      this.form.setControl('hidden', formBuilder.control(address.hidden));
    }
    if (data.confirmationPasswordInput) {
      this.form.setControl('confirmationPassword', formBuilder.control(null, Validators.required));
    }
  }

  fieldLabel(field: AddressFieldEnum): string {
    return ApiHelper.addressFieldLabel(field, this.messages);
  }

  save() {
    if (!this.form.valid) {
      return;
    }
    copyProperties(this.form.value, this.data.address, ['confirmationPassword']);
    this.data.address.location = this.location.value;
    if (this.id == null) {
      // Creating a new address
      this.addressesService.createAddress({
        user: ApiHelper.SELF,
        address: this.data.address,
        confirmationPassword: this.form.value.confirmationPassword
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    } else {
      // Saving an existing address
      this.addressesService.updateAddress({
        id: this.id,
        address: this.data.address,
        confirmationPassword: this.form.value.confirmationPassword
      }).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }
}
