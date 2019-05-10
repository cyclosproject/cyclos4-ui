import { AgmMarker, LatLngBounds } from '@agm/core';
import {
  ChangeDetectionStrategy, Component, ContentChild, EventEmitter,
  Injector, Input, Output, QueryList, TemplateRef, ViewChildren
} from '@angular/core';
import { Address } from 'app/api/models';
import { MapsService } from 'app/core/maps.service';
import { BaseComponent } from 'app/shared/base.component';
import { BlueMarker, empty, fitBounds, RedMarker } from 'app/shared/helper';
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



/**
 * Template for rendering results of distinct `ResultType`s
 */
@Component({
  selector: 'results-layout',
  templateUrl: 'results-layout.component.html',
  styleUrls: ['results-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsLayoutComponent<C, R> extends BaseComponent {

  redMarker = RedMarker;
  blueMarker = BlueMarker;

  private _resultType: ResultType;
  @Input() get resultType(): ResultType {
    return this._resultType;
  }
  set resultType(resultType: ResultType) {
    if (this._resultType !== ResultType.MAP && resultType === ResultType.MAP) {
      this.mapReadyNotified = false;
      if (this.mapLoaded) {
        setTimeout(() => this.adjustMap(), 100);
      }
    }
    this._resultType = resultType;
  }

  @Input() categories: C[];
  @Input() results: PagedResults<R>;
  @Input() rendering$ = new BehaviorSubject(false);
  @Input() referencePoint: MaxDistance;
  @Output() update = new EventEmitter<PageData>();

  @ContentChild(ResultCategoryDirective, { read: TemplateRef }) categoryTemplate: TemplateRef<any>;
  @ContentChild(ResultTableDirective, { read: TemplateRef }) tableTemplate: TemplateRef<any>;
  @ContentChild(MobileResultDirective, { read: TemplateRef }) mobileResultTemplate: TemplateRef<any>;
  @ContentChild(ResultTileDirective, { read: TemplateRef }) tileTemplate: TemplateRef<any>;
  @ContentChild(ResultInfoWindowDirective, { read: TemplateRef }) infoWindowTemplate: TemplateRef<any>;
  @ViewChildren(AgmMarker) markers: QueryList<AgmMarker>;

  mapBounds$ = new BehaviorSubject<LatLngBounds>(null);
  mapLoaded = false;
  mapReadyNotified = false;

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

  adjustMap() {
    if (this.resultType !== ResultType.MAP) {
      return;
    }
    this.mapLoaded = true;

    const mapData = this.maps.data;
    const rows = (this.results || <any>{}).results;
    if (!empty(rows)) {
      if (mapData.defaultLocation == null) {
        // Only fit the map to locations if there's no default location
        const allAddresses = rows.map((row: any) => this.toAddress(row));
        if (this.referencePoint) {
          allAddresses.push(this.referencePoint);
        }
        this.mapBounds$.next(fitBounds(allAddresses));
      }
    }
    if (!this.mapReadyNotified) {
      this.mapReadyNotified = true;
      this.notifyReady();
    }
  }

  closeAllInfoWindows() {
    if (this.markers) {
      this.markers.forEach(m => m.infoWindow.forEach(iw => iw.close()));
    }
  }

  showPaginator(results: PagedResults<any>): boolean {
    if (results == null) {
      return false;
    }
    if (results.hasTotalCount) {
      return results.pageCount > 1;
    } else {
      return results.page > 0 || results.hasNext;
    }
  }

  linkUrl(row: R): string {
    let link = this.toLink ? this.toLink(row) : null;
    if (link instanceof Array) {
      link = link.join('/');
    } else if (!link) {
      link = '#';
    }
    return link;
  }

  handleClick(row: R, event: Event) {
    let stop = false;
    if (this.onClick) {
      this.onClick(row);
      stop = true;
    } else {
      const link = this.toLink ? this.toLink(row) : null;
      if (typeof link === 'string') {
        this.router.navigateByUrl(link);
        stop = true;
      } else if (link instanceof Array) {
        this.router.navigate(link);
        stop = true;
      }
    }
    if (stop) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
}
