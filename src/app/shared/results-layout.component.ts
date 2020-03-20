/// <reference types="@types/googlemaps" />
/// <reference types="@types/markerclustererplus" />

import {
  AfterViewInit, ChangeDetectionStrategy, Component, ContentChild,
  EventEmitter, Injector, Input, OnChanges, Output, QueryList, SimpleChanges, TemplateRef, ViewChildren, ElementRef, ViewChild
} from '@angular/core';
import { Address } from 'app/api/models';
import { Configuration } from 'app/configuration';
import { MapsService } from 'app/core/maps.service';
import { BaseComponent } from 'app/shared/base.component';
import { MaxDistance } from 'app/shared/max-distance';
import { MobileResultDirective } from 'app/shared/mobile-result.directive';
import { PageData } from 'app/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { ResultCategoryDirective } from 'app/shared/result-category.directive';
import { ResultInfoWindowDirective } from 'app/shared/result-info-window.directive';
import { ResultTableDirective } from 'app/shared/result-table.directive';
import { ResultTileDirective } from 'app/shared/result-tile.directive';
import { ResultType } from 'app/shared/result-type';
import { BehaviorSubject } from 'rxjs';
import { empty } from 'app/shared/helper';

/**
 * Template for rendering results of distinct `ResultType`s
 */
@Component({
  selector: 'results-layout',
  templateUrl: 'results-layout.component.html',
  styleUrls: ['results-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsLayoutComponent<C, R> extends BaseComponent implements AfterViewInit, OnChanges {

  mainMarker = Configuration.mainMapMarker;
  altMarker = Configuration.altMapMarker;

  @Input() resultType: ResultType = ResultType.LIST;
  @Input() categories: C[];
  @Input() results: PagedResults<R> | R[];
  @Input() rendering$ = new BehaviorSubject(false);
  @Input() referencePoint: MaxDistance;
  @Output() update = new EventEmitter<PageData>();

  @ContentChild(ResultCategoryDirective, { static: false, read: TemplateRef }) categoryTemplate: TemplateRef<any>;
  @ContentChild(ResultTableDirective, { static: false, read: TemplateRef }) tableTemplate: TemplateRef<any>;
  @ContentChild(MobileResultDirective, { static: false, read: TemplateRef }) mobileResultTemplate: TemplateRef<any>;
  @ContentChild(ResultTileDirective, { static: false, read: TemplateRef }) tileTemplate: TemplateRef<any>;
  @ContentChild(ResultInfoWindowDirective, { static: false, read: TemplateRef }) infoWindowTemplate: TemplateRef<any>;
  @ViewChild('infoWindowContent', { static: false, read: TemplateRef }) infoWindowContent: TemplateRef<any>;
  @ViewChildren('mapContainer') mapContainerList: QueryList<ElementRef<HTMLDivElement>>;
  private lastMapContainer: HTMLDivElement;

  private mapContainer: HTMLElement;
  private map: google.maps.Map;
  private referenceMarker: google.maps.Marker;
  private markerClusterer: MarkerClusterer;
  private infoWindows: google.maps.InfoWindow[] = [];

  @Input() onClick: (row: R) => void;
  @Input() toLink: (row: R) => string | string[];
  @Input() toAddress: (row: R) => Address = (x) => x;
  @Input() toMarkerTitle: (row: R) => string = (x) => x['display'] || x['name'];

  constructor(
    injector: Injector,
    public maps: MapsService
  ) {
    super(injector);
  }

  notifyReady() {
    // Need to use a timeout for change detection to trigger
    if (this.rendering$.value) {
      setTimeout(() => {
        this.rendering$.next(false);
      }, 10);
    }
  }

  ngAfterViewInit() {
    this.addSub(this.mapContainerList.changes.subscribe(() => {
      const containerRef = this.mapContainerList.first;
      const container = containerRef == null ? null : containerRef.nativeElement;
      if (container != null && container !== this.lastMapContainer) {
        this.updateMap();
      }
      this.lastMapContainer = container;
    }));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.results || changes.resultType) {
      this.clearMap();
      this.updateMap();
    }
  }

  get rows(): R[] {
    if (this.results instanceof Array) {
      return this.results;
    } else if (this.results) {
      return this.results.results || [];
    } else {
      return [];
    }
  }

  closeAllInfoWindows() {
    this.infoWindows.forEach(iw => iw.close());
  }

  showPaginator(): boolean {
    if (this.results == null || this.results instanceof Array) {
      return false;
    }
    if (this.results.hasTotalCount) {
      return this.results.pageCount > 1;
    } else {
      return this.results.page > 0 || this.results.hasNext;
    }
  }

  linkUrl(row: R): string {
    let link = this.toLink ? this.toLink(row) : null;
    if (link instanceof Array) {
      link = link.join('/');
    }
    return link;
  }

  handleClick(row: R, event: Event) {
    if (this.onClick) {
      this.onClick(row);
    } else {
      const link = this.toLink ? this.toLink(row) : null;
      if (typeof link === 'string') {
        this.router.navigateByUrl(link);
      } else if (link instanceof Array) {
        this.router.navigate(link);
      }
    }
    event.stopPropagation();
    event.preventDefault();
  }


  private updateMap() {
    if (empty(this.rows) || this.resultType !== ResultType.MAP || !this.mapContainerList || !this.maps.enabled || !this.toAddress) {
      return;
    }
    const container = this.mapContainerList.first;
    if (container && container.nativeElement) {
      this.addSub(this.maps.ensureScriptLoaded().subscribe(() => this.renderMap()));
    }
  }

  private clearMap() {
    // Remove any previous markers and close all info windows
    if (this.markerClusterer) {
      this.markerClusterer.clearMarkers();
    }
    if (this.referenceMarker) {
      this.referenceMarker.setMap(null);
      this.referenceMarker = null;
    }
    this.closeAllInfoWindows();
    this.infoWindows = [];
  }

  private renderMap() {
    this.clearMap();

    const ref = this.mapContainerList.first;
    const mapContainerParent = ref == null ? null : ref.nativeElement;
    if (mapContainerParent == null) {
      // No parent element for the map?
      return;
    }

    const rows = this.rows;
    if (rows.find(r => {
      const address = this.toAddress(r);
      return address == null || !address.location;
    })) {
      // When there's at least one null address, it means the result type was updated but the rows are still
      // the ones from a previous result type. In this case we can safely ignore.
      return;
    }

    if (this.map) {
      // A previous map was already present
      if (this.mapContainer.parentElement) {
        this.mapContainer.parentElement.removeChild(this.mapContainer);
      }
    } else {
      this.mapContainer = document.createElement('div');
      this.map = this.maps.newGoogleMap(this.mapContainer);
      this.map.addListener('click', () => this.closeAllInfoWindows());
      this.markerClusterer = new MarkerClusterer(this.map, [], {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        minimumClusterSize: 5,
        maxZoom: 16
      });
    }

    const bounds = new google.maps.LatLngBounds();

    // Convert each result to a point
    const markers = new Array<google.maps.Marker>(rows.length);
    rows.forEach(r => {
      const address = this.toAddress(r);
      const location = address == null ? null : address.location;
      const title = this.toMarkerTitle ? this.toMarkerTitle(r) : address.name;
      if (location) {
        const marker = new google.maps.Marker({
          title: title,
          icon: Configuration.mainMapMarker,
          position: new google.maps.LatLng(location.latitude, location.longitude)
        });
        bounds.extend(marker.getPosition());
        marker.addListener('click', () => {
          this.closeAllInfoWindows();
          const infoWindow = this.infoWindow(marker);
          const view = this.infoWindowContent.createEmbeddedView({
            $implicit: r, address: address
          });
          view.detectChanges();
          const roots = view.rootNodes;
          if (!empty(roots)) {
            infoWindow.setContent(roots[0]);
            infoWindow.open(this.map, marker);
          }
        });
        markers.push(marker);
      }
    });

    // If there's a reference point, render it
    if (this.referencePoint) {
      this.referenceMarker = new google.maps.Marker({
        position: new google.maps.LatLng(this.referencePoint.latitude, this.referencePoint.longitude),
        title: this.referencePoint.name,
        icon: Configuration.altMapMarker
      });
      if (this.referencePoint.name) {
        this.referenceMarker.addListener('click', () => {
          const infoWindow = this.infoWindow(this.referenceMarker);
          infoWindow.setContent(this.referencePoint.name);
          infoWindow.open(this.map, this.referenceMarker);
        });
      }
      this.referenceMarker.setMap(this.map);
      bounds.extend(this.referenceMarker.getPosition());
    }

    mapContainerParent.appendChild(this.mapContainer);
    this.markerClusterer.addMarkers(markers);
    setTimeout(() => this.map.fitBounds(bounds));
  }

  private infoWindow(marker: google.maps.Marker): google.maps.InfoWindow {
    let infoWindow = marker['infoWindow'] as google.maps.InfoWindow;
    if (!infoWindow) {
      infoWindow = new google.maps.InfoWindow();
      marker['infoWindow'] = infoWindow;
      this.infoWindows.push(infoWindow);
    }
    return infoWindow;
  }
}
