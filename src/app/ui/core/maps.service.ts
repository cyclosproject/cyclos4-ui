/// <reference types="@types/googlemaps" />

import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/loader';
import { Address, AddressManage, GeographicalCoordinate, MapData } from 'app/api/models';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { blank, empty } from 'app/shared/helper';
import { Configuration } from 'app/ui/configuration';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { from, Observable, of, timer } from 'rxjs';
import { filter, first, switchMap, take } from 'rxjs/operators';

const StaticUrl = 'https://maps.googleapis.com/maps/api/staticmap';
const ExternalUrl = 'https://www.google.com/maps/search/?api=1';
const MarkerClustererPlusUrl = 'https://unpkg.com/@google/markerclustererplus@5.0.3/dist/markerclustererplus.min.js';

/**
 * Helper classes to work with Google Maps
 */
@Injectable({
  providedIn: 'root',
})
export class MapsService {

  private geocoder: google.maps.Geocoder;
  private geocoderCache = new Map<string, GeographicalCoordinate>();
  private _data: MapData;
  private loader: Loader;
  private markerClustererPlusStatus: 'none' | 'loading' | 'loaded' = 'none';

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private uiLayout: UiLayoutService) {
    this.dataForUiHolder.subscribe(dataForUi => this._data = dataForUi.mapData);
    if (dataForUiHolder.dataForUi) {
      this._data = dataForUiHolder.dataForUi.mapData;
    }
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
    return this._data;
  }

  /**
   * Geocodes the given address fields, that is, transforms an address to a geographical coordinate
   * @param fields The address field values
   */
  geocode(fields: AddressManage | string[]): Observable<GeographicalCoordinate> {
    if (!this.enabled || fields == null) {
      return of(null);
    }
    return this.ensureScriptLoaded().pipe(
      first(),
      switchMap(() => this.doGeocode(fields)),
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
    return `${StaticUrl}?size=${width}x${height}&scale=${scale}&zoom=15`
      + `&markers=icon:${Configuration.mainMapMarker}|${coords.latitude},${coords.longitude}&key=${key}`
      + this.styles();
  }

  private styles(): string {
    const mapStyles = this.uiLayout.googleMapStyles;
    if (empty(mapStyles)) {
      return '';
    }
    const toStyle = (s: google.maps.MapTypeStyle) => {
      const parts: string[] = [];
      if (s.featureType) {
        parts.push(`feature:${s.featureType}`);
      }
      if (s.elementType) {
        parts.push(`element:${s.elementType}`);
      }
      (s.stylers || []).forEach(st => {
        for (const key of Object.keys(st)) {
          let value = String(st[key]);
          if (blank(value)) {
            continue;
          }
          if (value.startsWith('#')) {
            // Colors must be encoded as hex
            value = value.replace('#', '0x');
          }
          parts.push(`${key}:${value}`);
        }
      });
      return `&style=` + parts.join('|');
    };
    return mapStyles.map(toStyle).join('');
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
    return `${ExternalUrl}&query=${coords.latitude},${coords.longitude}`;
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
        a.country,
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
      address: query,
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

  /**
   * Instantiates a new google map in the given container element
   */
  newGoogleMap(container: HTMLElement) {
    return new google.maps.Map(container, {
      mapTypeControl: false,
      streetViewControl: false,
      gestureHandling: this.uiLayout.ltsm ? 'cooperative' : 'greedy',
      minZoom: 2,
      maxZoom: 17,
      styles: this.uiLayout.googleMapStyles,
    });
  }

  /**
   * Returns an `Observable` that emits when the google maps script is fully loaded
   */
  ensureScriptLoaded(): Observable<void> {
    if (this.loader == null) {
      this.loader = new Loader({
        apiKey: this.data.googleMapsApiKey,
      });
    }
    return from(this.loader.loadPromise()).pipe(
      switchMap(() => {
        switch (this.markerClustererPlusStatus) {
          case 'none':
            this.markerClustererPlusStatus = 'loading';
            return new Observable(obs => {
              const script = document.createElement('script');
              script.type = 'text/javascript';
              script.src = MarkerClustererPlusUrl;
              script.async = true;
              script.onload = () => {
                this.markerClustererPlusStatus = 'loaded';
                obs.next(null);
                obs.complete();
              };
              script.onerror = e => {
                obs.error(e);
                obs.complete();
                this.markerClustererPlusStatus = 'none';
              };
              document.head.appendChild(script);
            });
          case 'loading':
            // In the process of loading. Wait unti it is available
            return timer(100).pipe(
              filter(() => !!window['MarkerClusterer']),
              take(1),
            );
          case 'loaded':
            // Already loaded
            return of(null);
        }
      }),
    );
  }
}
