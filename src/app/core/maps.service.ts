import { Injectable } from '@angular/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { MapData, GeographicalCoordinate } from 'app/api/models';
import { Observable, of, from } from 'rxjs';
import { MapsAPILoader } from '@agm/core';
import { } from '@types/googlemaps';
import { empty } from 'app/shared/helper';
import { mergeMap } from 'rxjs/operators';

/**
 * Helper classes to work with Google Maps
 */
@Injectable()
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
  geocode(fields: string[]): Observable<GeographicalCoordinate> {
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

  private doGeocode(fields: string[]): Observable<GeographicalCoordinate> {
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
