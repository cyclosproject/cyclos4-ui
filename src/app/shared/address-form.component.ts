import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  AddressConfiguration, AddressConfigurationForUserProfile,
  AddressFieldEnum, Country, CustomFieldBinaryValues
} from 'app/api/models';
import { AddressHelperService } from 'app/core/address-helper.service';
import { CountriesResolve } from 'app/countries.resolve';
import { BaseComponent } from 'app/shared/base.component';
import { truthyAttr } from 'app/shared/helper';

/**
 * Form used to input all fields of an address
 */
@Component({
  selector: 'address-form',
  templateUrl: 'address-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent extends BaseComponent implements OnInit {
  constructor(
    injector: Injector,
    private addressHelper: AddressHelperService,
    public countriesResolve: CountriesResolve
  ) {
    super(injector);
  }

  @Input() configuration: AddressConfiguration;
  @Input() addressForm: FormGroup;
  @Input() countries: Country[];
  @Input() idPrefix = '';
  @Input() idSuffix = '';
  @Input() binaryValues: CustomFieldBinaryValues;

  _ignoreContactFields: boolean | string = false;
  @Input() get ignoreContactFields(): boolean | string {
    return this._ignoreContactFields;
  }
  set ignoreContactFields(flag: boolean | string) {
    this._ignoreContactFields = truthyAttr(flag);
  }

  profileConfiguration: AddressConfigurationForUserProfile;

  private _managePrivacy: boolean | string = false;
  @Input() get managePrivacy(): boolean | string {
    return this._managePrivacy;
  }
  set managePrivacy(manage: boolean | string) {
    this._managePrivacy = truthyAttr(manage);
  }

  getLabel(field: AddressFieldEnum): string {
    return this.addressHelper.addressFieldLabel(field);
  }

  isRequired(field: AddressFieldEnum): boolean {
    return (this.configuration.requiredFields || []).includes(field);
  }

  ngOnInit() {
    super.ngOnInit();
    this.profileConfiguration = this.configuration as AddressConfigurationForUserProfile;
  }

}
