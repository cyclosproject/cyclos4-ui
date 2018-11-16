/// <reference types="@types/googlemaps" />

import { Injectable } from '@angular/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { MapData, GeographicalCoordinate, AddressManage } from 'app/api/models';
import { Observable, of, from } from 'rxjs';
import { MapsAPILoader } from '@agm/core';
import { empty } from 'app/shared/helper';
import { mergeMap } from 'rxjs/operators';
import { Address } from 'app/api/models';

const STATIC_URL = 'https://maps.googleapis.com/maps/api/staticmap';
const EXTERNAL_URL = 'https://www.google.com/maps/search/?api=1';


/**
 * Helper classes to work with Google Maps
 */
@Injectable({
  providedIn: 'root'
})
export class MapsService {
  private geocoder: google.maps.Geocoder;
  private geocoderCache = new Map<string, GeographicalCoordinate>();

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private mapsAPILoader: MapsAPILoader) {
  }

  /**
   * Returns whether maps are enabled, that is, there is a Google Maps API key set.
   */
  get enabled(): boolean {
    const mapData = this.data;
    return mapData == null ? false : mapData.googleMapsApiKey != null;
  }

  /**
   * Returns the map data
   */
  get data(): MapData {
    const dataForUi = this.dataForUiHolder.dataForUi;
    return dataForUi == null ? null : dataForUi.mapData;
  }

  /**
   * Geocodes the given address fields, that is, transforms an address to a geographical coordinate
   * @param fields The address field values
   */
  geocode(fields: AddressManage | string[]): Observable<GeographicalCoordinate> {
    if (!this.enabled || fields == null) {
      return of(null);
    }
    if (this.geocoder != null) {
      return this.doGeocode(fields);
    }
    return from(this.mapsAPILoader.load()).pipe(
      mergeMap(() => this.doGeocode(fields))
    );
  }

  /**
   * Returns the URL for a static map showing the given address / location, with the given dimensions
   * @param location Wither an `Address` or a `GeographicalCoordinate`
   * @param width The image width
   * @param width The image height
   */
  staticUrl(location: Address | GeographicalCoordinate, width: number, height: number): string {
    const coords = this.coords(location);
    if (coords == null) {
      return null;
    }
    const key = this.data.googleMapsApiKey;
    const scale = (window.devicePixelRatio || 0) >= 2 ? 2 : 1;
    return `${STATIC_URL}?size=${width}x${height}&scale=${scale}&zoom=15`
      + `&markers=${coords.latitude},${coords.longitude}&key=${key}`;
  }

  /**
   * Returns the URL for an external map view of a specific location
   * @param location Wither an `Address` or a `GeographicalCoordinate`
   */
  externalUrl(location: Address | GeographicalCoordinate): string {
    const coords = this.coords(location);
    if (coords == null) {
      return null;
    }
    return `${EXTERNAL_URL}&query=${coords.latitude},${coords.longitude}`;
  }

  private coords(location: Address | GeographicalCoordinate): GeographicalCoordinate {
    return (location as Address).location ? (location as any).location : location;
  }

  private doGeocode(fieldsOrAddress: AddressManage | string[]): Observable<GeographicalCoordinate> {
    let fields: string[];
    if (fieldsOrAddress instanceof Array) {
      // When the input is an array of fields, use it directly
      fields = fieldsOrAddress;
    } else {
      // When an address, extract each field
      const a = fieldsOrAddress as AddressManage;
      fields = [
        a.addressLine1,
        a.addressLine2,
        a.street,
        a.buildingNumber,
        a.neighborhood,
        a.city,
        a.zip,
        a.region,
        a.country
      ];
    }
    fields = (fields || []).filter(f => !empty(f));
    if (fields.length === 0) {
      return of(null);
    }
    if (this.geocoder == null) {
      this.geocoder = new google.maps.Geocoder();
    }
    const query = fields.join(', ');
    const cached = this.geocoderCache.get(query);
    if (cached !== undefined) {
      // The value is already cached
      return of(cached);
    }

    const req: google.maps.GeocoderRequest = {
      region: this.dataForUiHolder.dataForUi.country,
      address: query
    };
    return new Observable(observer => {
      this.geocoder.geocode(req, (results, status) => {
        switch (status) {
          case google.maps.GeocoderStatus.OK:
            const res = results[0];
            const loc = res.geometry.location;
            const coords: GeographicalCoordinate = { latitude: loc.lat(), longitude: loc.lng() };
            this.geocoderCache.set(query, coords);
            observer.next(coords);
            break;
          case google.maps.GeocoderStatus.ZERO_RESULTS:
            this.geocoderCache.set(query, null);
            observer.next(null);
            break;
          default:
            observer.error(status);
            break;
        }
        observer.complete();
      });
    });
  }

}
