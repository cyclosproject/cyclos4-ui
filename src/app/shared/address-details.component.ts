import { ChangeDetectionStrategy, Component, Injector, Input } from '@angular/core';
import { Address } from 'app/api/models';
import { CountriesResolve } from 'app/countries.resolve';
import { BaseComponent } from 'app/shared/base.component';
import { AddressHelperService } from 'app/core/address-helper.service';

/**
 * Component used to show the details of an address
 */
@Component({
  selector: 'address-details',
  templateUrl: 'address-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressDetailsComponent extends BaseComponent {
  constructor(
    injector: Injector,
    public addressHelper: AddressHelperService,
    public countriesResolve: CountriesResolve
  ) {
    super(injector);
  }

  @Input() address: Address;
  @Input() elementClass: string;

  get classNames() {
    return this.elementClass ? [this.elementClass] : 'mb-1';
  }

  get country(): string {
    if (this.address.country) {
      return this.countriesResolve.name(this.address.country);
    }
  }
}
