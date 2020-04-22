/// <reference types="@types/googlemaps" />

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Injector, Input, OnInit, ViewChild } from '@angular/core';
import { AddressView } from 'app/api/models';
import { Configuration } from 'app/configuration';
import { AddressHelperService } from 'app/core/address-helper.service';
import { CountriesResolve } from 'app/countries.resolve';
import { BaseComponent } from 'app/shared/base.component';
import { Breakpoint } from 'app/shared/layout.service';

/**
 * Shows the user / advertisement address(es) in the view page
 */
@Component({
  selector: 'profile-addresses',
  templateUrl: 'profile-addresses.component.html',
  styleUrls: ['profile-addresses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAddressesComponent extends BaseComponent implements OnInit, AfterViewInit {
  constructor(
    injector: Injector,
    public addressHelper: AddressHelperService,
    public countriesResolve: CountriesResolve,
  ) {
    super(injector);
  }

  @ViewChild('mapContainer') mapContainer: ElementRef;
  map: google.maps.Map;

  private allInfoWindows: google.maps.InfoWindow[] = [];

  @Input() addresses: AddressView[];

  locatedAddresses: AddressView[];

  ngOnInit() {
    super.ngOnInit();
    this.locatedAddresses = (this.addresses || []).filter(a => a.location);
  }

  ngAfterViewInit() {
    // We'll only use a dynamic map with multiple located addresses
    if (this.locatedAddresses.length > 1) {
      this.addSub(this.maps.ensureScriptLoaded().subscribe(() => this.showMap()));
    }
  }

  closeAllInfoWindows() {
    this.allInfoWindows.forEach(iw => iw.close());
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

  private showMap() {
    const container = this.mapContainer.nativeElement as HTMLElement;
    this.map = new google.maps.Map(container, {
      mapTypeControl: false,
      streetViewControl: false,
      minZoom: 2,
      maxZoom: 17,
      styles: this.layout.googleMapStyles,
    });
    const bounds = new google.maps.LatLngBounds();
    this.locatedAddresses.map(a => {
      const marker = new google.maps.Marker({
        title: a.name,
        icon: Configuration.mainMapMarker,
        position: new google.maps.LatLng(a.location.latitude, a.location.longitude),
      });
      bounds.extend(marker.getPosition());
      marker.addListener('click', () => {
        this.closeAllInfoWindows();
        let infoWindow = marker['infoWindow'] as google.maps.InfoWindow;
        if (!infoWindow) {
          infoWindow = new google.maps.InfoWindow({
            content: marker.getTitle(),
          });
          this.allInfoWindows.push(infoWindow);
        }
        infoWindow.open(marker.getMap(), marker);
      });
      marker.setMap(this.map);
    });
    this.map.addListener('click', () => this.closeAllInfoWindows());
    this.map.fitBounds(bounds);
  }
}
