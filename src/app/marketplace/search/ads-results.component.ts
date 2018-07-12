import {
  Component, ChangeDetectionStrategy, Injector, Input, EventEmitter, Output,
  ViewChildren, QueryList, ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { AdDataForSearch, AdResult, Currency, AdCategoryWithChildren } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { ResultType } from 'app/shared/result-type';
import { TableDataSource } from 'app/shared/table-datasource';
import { MapsService } from 'app/core/maps.service';
import { LatLngBounds, AgmInfoWindow } from '@agm/core';
import { fitBounds, empty, TILE_WIDTH } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';

const MAX_COLUMNS = 5;
const MAX_TILE_FIELDS = 1;

/**
 * Displays the results of a advertisements search
 */
@Component({
  selector: 'ads-results',
  templateUrl: 'ads-results.component.html',
  styleUrls: ['ads-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdsResultsComponent extends BaseComponent implements AfterViewInit {

  tileWidth = TILE_WIDTH;

  displayedColumns = new BehaviorSubject<string[]>([]);

  // Export enum to the template
  ResultType = ResultType;

  mapReady = false;

  @Input() query: any;

  /** This input is here only to force a change in an @Input() field, so change detection properly works with OnPush */
  @Input() rendering = false;

  @Input() dataSource: TableDataSource<AdResult>;

  @Input() data: AdDataForSearch;

  @Input() resultType: ResultType;

  @Output() update = new EventEmitter<null>();

  @Output() load = new EventEmitter<null>();

  @Output() categorySelected = new EventEmitter<AdCategoryWithChildren>();

  @ViewChild('categories') categoriesContainer: ElementRef;

  emptyCategories = new BehaviorSubject<Array<any>>([]);

  noCategoriesWithChildren = true;

  mapFitBounds = new BehaviorSubject<LatLngBounds>(null);

  addressStreet = ApiHelper.addressStreet;

  @ViewChildren(AgmInfoWindow) infoWindows: QueryList<AgmInfoWindow>;

  constructor(
    injector: Injector,
    public maps: MapsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    // Check if there's at least one category with children
    for (const cat of this.data.categories || []) {
      if (!empty(cat.children)) {
        this.noCategoriesWithChildren = false;
        break;
      }
    }
    this.dataSource.data.subscribe(rows => {
      this.updateDisplayedColumns();
      this.adjustMap();
    });

    // We need the exact pixel dimensions to calculate the categories empty spaces
    this.subscriptions.push(fromEvent(window, 'resize').subscribe(() =>
      this.updateEmptyCategories()));
  }

  ngAfterViewInit() {
    this.updateEmptyCategories();
  }

  /**
   * Returns the identifiers of fields to show in the result list
   */
  get fieldsInList(): string[] {
    let arr = this.data.fieldsInList || [];
    if (arr.length > MAX_COLUMNS) {
      arr = arr.slice(0, MAX_COLUMNS);
    }
    return arr;
  }

  /**
   * Returns the identifiers of fields to show in tiled view
   */
  get fieldsInTile(): string[] {
    let arr = this.data.fieldsInList || [];
    if (arr.length > MAX_TILE_FIELDS) {
      arr = arr.slice(0, MAX_TILE_FIELDS);
    }
    return arr;
  }

  /**
   * Returns whether the table header should be shown.
   * We don't show it if there are no profile fields in list, or with XS devices
   */
  get showHeader(): boolean {
    return this.layout.gtxs && this.fieldsInList.length > 0;
  }

  /**
   * Returns the internal name of the field with the given index
   * @param field The field index
   */
  fieldInternalName(field: number): string {
    return this.fieldsInList[field];
  }

  /**
   * Returns the display name of the given field
   * @param field The field identifier
   */
  fieldName(field: string | number): string {
    if (typeof field === 'number') {
      // Lookup the field id by index
      return this.fieldName(this.fieldInternalName(field));
    }
    switch (field) {
      case 'name':
        return this.messages.userName();
      case 'username':
        return this.messages.userUsername();
      case 'email':
        return this.messages.userEmail();
      case 'phone':
        return this.messages.userPhone();
      case 'accountNumber':
        return this.messages.userAccountNumber();
      default:
        for (const cf of this.data.customFields) {
          if (cf.internalName === field) {
            return cf.name;
          }
        }
    }
    return null;
  }

  private updateDisplayedColumns() {
    if (this.layout.xs) {
      // In mobile layout there's an aggregated column
      this.displayedColumns.next(['avatar', 'aggregated']);
    } else {
      // In other layouts show the specific columns, plus the avatar
      // As the columns cannot be dynamically defined, we define up to
      // 5 columns, named field0, field1, ...
      const fields: string[] = [];
      fields.push('avatar');
      fields.push('name');
      fields.push('owner');
      for (let i = 0; i < this.fieldsInList.length; i++) {
        fields.push('field' + i);
      }
      fields.push('price');
      this.displayedColumns.next(fields);
    }
  }

  triggerUpdate() {
    this.update.next(null);
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.updateDisplayedColumns();
  }

  adjustMap() {
    if (this.resultType !== ResultType.MAP) {
      return;
    }
    const mapData = this.maps.data;
    const rows = this.dataSource.data.value;
    if (mapData != null && mapData.defaultLocation == null) {
      // Only fit the map to locations if there's no default location
      this.mapFitBounds.next(rows == null ? null : fitBounds(rows.map(row => row.address)));
    }
    if (rows != null && this.mapReady) {
      this.notifyLoad();
    }
  }

  notifyLoad() {
    this.load.emit(null);
  }


  /**
   * Returns the route components for the given ad
   * @param ad The advertisement
   */
  path(ad: AdResult): string[] {
    return ['/marketplace', 'view', ad.id];
  }

  /**
   * Returns the currency for the given ad
   * @param ad The advertisement
   */
  lookupCurrency(ad: AdResult): Currency {
    const currencies = this.data.currencies;
    return currencies.find(c => c.internalName === ad.currency || c.id === ad.currency);
  }

  /**
   * Returns the number of decimals for the given ad's price
   * @param ad The advertisement
   */
  decimals(ad: AdResult): number {
    return (this.lookupCurrency(ad) || {}).decimalDigits || 0;
  }

  closeAllInfoWindows() {
    this.infoWindows.forEach(iw => iw.close());
  }

  private updateEmptyCategories() {
    if (!this.categoriesContainer) {
      return;
    }
    if (this.layout.gtxs) {
      const width = <number>this.categoriesContainer.nativeElement.clientWidth;
      const tilesPerRow = Math.floor(width / this.tileWidth);
      const lastRow = this.data.categories.length % tilesPerRow;
      const missing = tilesPerRow - lastRow;
      this.emptyCategories.next(missing === 0 ? [] : ' '.repeat(missing).split(''));
    } else if (this.emptyCategories.value.length > 0) {
      this.emptyCategories.next([]);
    }


  }
}
