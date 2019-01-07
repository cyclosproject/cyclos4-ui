import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressConfiguration, AddressFieldEnum, Address } from 'app/api/models';
import { Messages } from 'app/messages/messages';

/**
 * Helper service for handling address fields
 */
@Injectable({
  providedIn: 'root'
})
export class AddressHelperService {

  constructor(
    private formBuilder: FormBuilder,
    private messages: Messages) {
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
        return this.messages.address.line1;
      case AddressFieldEnum.ADDRESS_LINE_2:
        return this.messages.address.line2;
      case AddressFieldEnum.BUILDING_NUMBER:
        return this.messages.address.buildingNumber;
      case AddressFieldEnum.CITY:
        return this.messages.address.city;
      case AddressFieldEnum.COMPLEMENT:
        return this.messages.address.complement;
      case AddressFieldEnum.COUNTRY:
        return this.messages.address.country;
      case AddressFieldEnum.NEIGHBORHOOD:
        return this.messages.address.neighborhood;
      case AddressFieldEnum.PO_BOX:
        return this.messages.address.poBox;
      case AddressFieldEnum.REGION:
        return this.messages.address.region;
      case AddressFieldEnum.STREET:
        return this.messages.address.street;
      case AddressFieldEnum.ZIP:
        return this.messages.address.zip;
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
