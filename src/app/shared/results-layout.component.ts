import {
  Component, ChangeDetectionStrategy, Input, TemplateRef, ContentChild, Output, EventEmitter, QueryList, ViewChildren
} from '@angular/core';
import { Address } from 'app/api/models';
import { ResultType } from 'app/shared/result-type';
import { AgmMarker, LatLngBounds } from '@agm/core';
import { PagedResults } from 'app/shared/paged-results';
import { ResultTableDirective } from 'app/shared/result-table.directive';
import { ResultTileDirective } from 'app/shared/result-tile.directive';
import { ResultCategoryDirective } from 'app/shared/result-category.directive';
import { LayoutService } from 'app/shared/layout.service';
import { MapsService } from 'app/core/maps.service';
import { BehaviorSubject } from 'rxjs';
import { PageData } from 'app/shared/page-data';
import { empty, fitBounds } from 'app/shared/helper';
import { ResultInfoWindowDirective } from 'app/shared/result-info-window.directive';
import { LoginService } from 'app/core/login.service';

/**
 * Template for rendering results of distinct `ResultType`s
 */
@Component({
  selector: 'results-layout',
  templateUrl: 'results-layout.component.html',
  styleUrls: ['results-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsLayoutComponent<C, R> {

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
  @Output() update = new EventEmitter<PageData>();

  @ContentChild(ResultCategoryDirective, { read: TemplateRef }) categoryTemplate;
  @ContentChild(ResultTableDirective, { read: TemplateRef }) tableTemplate;
  @ContentChild(ResultTileDirective, { read: TemplateRef }) tileTemplate;
  @ContentChild(ResultInfoWindowDirective, { read: TemplateRef }) infoWindowTemplate;
  @ViewChildren(AgmMarker) markers: QueryList<AgmMarker>;

  mapBounds$ = new BehaviorSubject<LatLngBounds>(null);
  mapLoaded = false;
  mapReadyNotified = false;

  @Input() toAddress: (R) => Address = (x) => x;
  @Input() toMarkerTitle: (R) => string = (x) => x['display'] || x['name'];

  constructor(
    public layout: LayoutService,
    public maps: MapsService,
    public login: LoginService
  ) { }

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
        this.mapBounds$.next(fitBounds(rows.map(row => this.toAddress(row))));
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
}
