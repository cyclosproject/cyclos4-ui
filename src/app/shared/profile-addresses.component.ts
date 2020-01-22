import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, ViewChildren, QueryList } from '@angular/core';
import { AddressView } from 'app/api/models';
import { AddressHelperService } from 'app/core/address-helper.service';
import { CountriesResolve } from 'app/countries.resolve';
import { BaseComponent } from 'app/shared/base.component';
import { AgmMarker, LatLngBounds } from '@agm/core';
import { BehaviorSubject } from 'rxjs';
import { Configuration } from 'app/configuration';
import { Breakpoint } from 'app/shared/layout.service';
import { fitBounds, empty } from 'app/shared/helper';

/**
 * Shows the user / advertisement address(es) in the view page
 */
@Component({
  selector: 'profile-addresses',
  templateUrl: 'profile-addresses.component.html',
  styleUrls: ['profile-addresses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileAddressesComponent extends BaseComponent implements OnInit {
  constructor(
    injector: Injector,
    public addressHelper: AddressHelperService,
    public countriesResolve: CountriesResolve
  ) {
    super(injector);
  }

  @Input() addresses: AddressView[];

  locatedAddresses: AddressView[];

  @ViewChildren(AgmMarker) markers: QueryList<AgmMarker>;
  mapBounds$ = new BehaviorSubject<LatLngBounds>(null);
  mainMarker = Configuration.mainMapMarker;

  ngOnInit() {
    super.ngOnInit();
    this.locatedAddresses = (this.addresses || []).filter(a => a.location);
  }


  adjustMap() {
    if (empty(this.locatedAddresses)) {
      const loc = this.maps.data.defaultLocation;
      this.mapBounds$.next(new google.maps.LatLngBounds({
        lat: loc.latitude, lng: loc.longitude
      }) as LatLngBounds);
    } else {
      // Only fit the map to locations if there's no default location
      this.mapBounds$.next(fitBounds(this.locatedAddresses));
    }
  }

  closeAllInfoWindows() {
    if (this.markers) {
      this.markers.forEach(m => m.infoWindow.forEach(iw => iw.close()));
    }
  }

  singleMapWidth(breakpoints: Set<Breakpoint>): number | 'auto' {
    if (breakpoints.has('xl')) {
      return 400;
    } else if (breakpoints.has('gt-xs')) {
      return 340;
    } else {
      return 'auto';
    }
  }
}
