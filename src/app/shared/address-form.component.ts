import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AddressConfiguration, AddressFieldEnum, Country } from 'app/api/models';
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
export class AddressFormComponent extends BaseComponent {
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
}
