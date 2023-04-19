import { ChangeDetectionStrategy, Component, HostBinding, Injector, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import {
  AddressConfiguration, AddressConfigurationForUserProfile,
  AddressFieldEnum, Country, CustomFieldBinaryValues
} from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { truthyAttr } from 'app/shared/helper';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { CountriesResolve } from 'app/ui/countries.resolve';

/**
 * Form used to input all fields of an address
 */
@Component({
  selector: 'address-form',
  templateUrl: 'address-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFormComponent extends BaseComponent implements OnInit {

  @HostBinding('class.d-block') displayBlock = true;

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

  constructor(
    injector: Injector,
    private addressHelper: AddressHelperService,
    public countriesResolve: CountriesResolve,
  ) {
    super(injector);
  }

  getLabel(field: AddressFieldEnum): string {
    return this.addressHelper.addressFieldLabel(field);
  }

  isRequired(field: AddressFieldEnum, control: AbstractControl): boolean {
    return (this.configuration.requiredFields || []).includes(field) && !control.disabled;
  }

  ngOnInit() {
    super.ngOnInit();
    this.profileConfiguration = this.configuration as AddressConfigurationForUserProfile;
  }

}
