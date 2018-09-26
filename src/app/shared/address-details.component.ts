import { Component, ChangeDetectionStrategy, Injector, Input, HostBinding } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { AddressView, Country } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';

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
    public countriesResolve: CountriesResolve
  ) {
    super(injector);
  }

  @Input() address: AddressView;
  @Input() elementClass: string;

  get country(): string {
    if (this.address.country) {
      return this.countriesResolve.name(this.address.country);
    }
  }
}
