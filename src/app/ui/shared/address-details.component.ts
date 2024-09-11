import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Address, AddressContactInfo, AddressView } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { CountriesResolve } from 'app/ui/countries.resolve';

/**
 * Component used to show the details of an address
 */
@Component({
  selector: 'address-details',
  templateUrl: 'address-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressDetailsComponent extends BaseComponent implements OnInit {
  constructor(
    injector: Injector,
    public addressHelper: AddressHelperService,
    public countriesResolve: CountriesResolve
  ) {
    super(injector);
  }

  @Input() address: Address;
  @Input() elementClass = 'data-item';

  contactInfo: AddressContactInfo;

  ngOnInit() {
    super.ngOnInit();
    const view = this.address as AddressView;
    if (view && view.contactInfo) {
      this.contactInfo = view.contactInfo;
    }
  }

  get country(): string {
    if (this.address.country) {
      return this.countriesResolve.name(this.address.country);
    }
  }
}
