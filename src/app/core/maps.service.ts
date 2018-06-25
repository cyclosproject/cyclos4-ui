import { Injectable } from '@angular/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { MapData } from 'app/api/models';

/**
 * Helper classes to work with Google Maps
 */
@Injectable()
export class MapsService {

  constructor(private dataForUiHolder: DataForUiHolder) {
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

}
