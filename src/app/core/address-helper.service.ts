import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressConfiguration, AddressFieldEnum, Address } from 'app/api/models';
import { I18n } from 'app/i18n/i18n';

/**
 * Helper service for handling address fields
 */
@Injectable({
  providedIn: 'root'
})
export class AddressHelperService {

  constructor(
    private formBuilder: FormBuilder,
    private i18n: I18n) {
  }

  /**
   * Builds a `FormGroup` containing controls for all enabled fields, plus id, version and name
   * @param config The address configuration
   */
  addressFormGroup(config: AddressConfiguration): FormGroup {
    const form = this.formBuilder.group({
      id: null,
      version: null,
      hidden: null,
      name: [null, Validators.required],
      location: this.formBuilder.group({
        latitude: null,
        longitude: null
      })
    });
    for (const field of config.enabledFields) {
      const val = config.requiredFields.includes(field) ? Validators.required : null;
      form.setControl(field, this.formBuilder.control(null, val));
    }
    return form;
  }

  /**
   * Returns the label of an address field
   * @param field The address field
   */
  addressFieldLabel(field: AddressFieldEnum): string {
    switch (field) {
      case AddressFieldEnum.ADDRESS_LINE_1:
        return this.i18n.address.line1;
      case AddressFieldEnum.ADDRESS_LINE_2:
        return this.i18n.address.line2;
      case AddressFieldEnum.BUILDING_NUMBER:
        return this.i18n.address.buildingNumber;
      case AddressFieldEnum.CITY:
        return this.i18n.address.city;
      case AddressFieldEnum.COMPLEMENT:
        return this.i18n.address.complement;
      case AddressFieldEnum.COUNTRY:
        return this.i18n.address.country;
      case AddressFieldEnum.NEIGHBORHOOD:
        return this.i18n.address.neighborhood;
      case AddressFieldEnum.PO_BOX:
        return this.i18n.address.poBox;
      case AddressFieldEnum.REGION:
        return this.i18n.address.region;
      case AddressFieldEnum.STREET:
        return this.i18n.address.street;
      case AddressFieldEnum.ZIP:
        return this.i18n.address.zip;
    }
    return null;
  }

  /**
   * Returns street, buildingNumber, complement if the given address has an address, otherwise, null
   * @param address Tha address
   */
  addressStreet(address: Address): string {
    if (address == null || address.street == null) {
      return null;
    }
    let result = address.street;
    if (address.buildingNumber) {
      result += ', ' + address.buildingNumber;
    }
    if (address.complement) {
      result += ', ' + address.complement;
    }
    return result;
  }
}
