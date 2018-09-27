import { Component, ChangeDetectionStrategy, Injector, Input, HostBinding } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { Country, AddressConfiguration, AddressFieldEnum } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup } from '@angular/forms';
import { truthyAttr } from 'app/shared/helper';
import { CountriesResolve } from 'app/countries.resolve';

/**
 * Form used to input all fields of an address
 */
@Component({
  selector: 'address-form',
  templateUrl: 'address-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressFormComponent extends BaseComponent {
  constructor(
    injector: Injector,
    public countriesResolve: CountriesResolve
  ) {
    super(injector);
  }

  @Input() configuration: AddressConfiguration;
  @Input() addressForm: FormGroup;
  @Input() countries: Country[];
  @Input() idPrefix = '';
  @Input() idSuffix = '';

  private _managePrivacy: boolean | string = false;
  @Input() get managePrivacy(): boolean | string {
    return this._managePrivacy;
  }
  set managePrivacy(manage: boolean | string) {
    this._managePrivacy = truthyAttr(manage);
  }

  getLabel(field: AddressFieldEnum): string {
    return ApiHelper.addressFieldLabel(field, this.i18n);
  }

  isRequired(field: AddressFieldEnum): boolean {
    return (this.configuration.requiredFields || []).includes(field);
  }
}
