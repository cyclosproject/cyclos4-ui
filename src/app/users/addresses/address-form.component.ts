import { Component, ChangeDetectionStrategy, Injector, Inject } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { AddressesService } from 'app/api/services';
import { AddressDataForEdit, AddressDataForNew, AddressFieldEnum } from 'app/api/models';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { copyProperties } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';

/**
 * Either create or edit a address
 */
@Component({
  selector: 'address-form',
  templateUrl: 'address-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent extends BaseComponent {

  form: FormGroup;
  id: string;
  title: string;
  managePrivacy = false;

  constructor(
    injector: Injector,
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddressFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddressDataForNew | AddressDataForEdit,
    public countriesResolve: CountriesResolve,
    private addressesService: AddressesService) {
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
