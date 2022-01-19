import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Address, AddressContactInfo, AddressView } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';

/**
 * Component used to show the details of an address
 */
@Component({
  selector: 'address-details-with-custom-fields',
  templateUrl: 'address-details-with-custom-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressDetailsWithCustomFieldsComponent extends BaseComponent implements OnInit {
  constructor(injector: Injector) {
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

}
