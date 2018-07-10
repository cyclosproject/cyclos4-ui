import { Component, ChangeDetectionStrategy, Injector, Input, EventEmitter, Output, ViewChildren, QueryList } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User, UserDataForSearch, ContactListDataForSearch, ContactResult, UserResult, Address, UserDataForMap } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { ResultType } from 'app/shared/result-type';
import { TableDataSource } from 'app/shared/table-datasource';
import { MapsService } from 'app/core/maps.service';
import { LatLngBounds, AgmInfoWindow } from '@agm/core';
import { fitBounds } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';

const MAX_COLUMNS = 7;
const MAX_TILE_FIELDS = 2;

/**
 * Displays the results of a user search
 */
@Component({
  selector: 'users-results',
  templateUrl: 'users-results.component.html',
  styleUrls: ['users-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersResultsComponent extends BaseComponent {
  displayedColumns = new BehaviorSubject<string[]>([]);

  // Export enum to the template
  ResultType = ResultType;

  mapReady = false;

  @Input() resultKind: 'user' | 'contact' = 'user';

  @Input() query: any;

  /** This input is here only to force a change in an @Input() field, so change detection properly works with OnPush */
  @Input() rendering = false;

  @Input() dataSource: TableDataSource<any>;

  @Input() data: UserDataForSearch | UserDataForMap | ContactListDataForSearch;

  @Input() resultType: ResultType;

  @Output() update = new EventEmitter<null>();

  @Output() load = new EventEmitter<null>();

  @ViewChildren(AgmInfoWindow) infoWindows: QueryList<AgmInfoWindow>;

  mapFitBounds = new BehaviorSubject<LatLngBounds>(null);

  addressStreet = ApiHelper.addressStreet;

  constructor(
    injector: Injector,
    public maps: MapsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.dataSource.data.subscribe(rows => {
      this.updateDisplayedColumns();
      this.adjustMap();
    });
  }

  /**
   * Returns the user displayed for the given result row
   * @param row The result from the search
   */
  user(row): User {
    if (this.resultKind === 'contact') {
      return (row as ContactResult).contact;
    }
    return row as User;
  }

  /**
   * Returns the custom values holder for the given result row
   * @param row The result from the search
   */
  customValues(row): any {
    if (row == null) {
      return null;
    }
    if (this.resultKind === 'contact') {
      return (row as ContactResult).customValues;
    }
    return (row as UserResult).customValues;
  }

  /**
   * Returns the address displayed for the given result row
   * @param row The result from the search
   */
  address(row): Address {
    if (this.resultKind === 'contact') {
      return null;
    }
    return (row as UserResult).address;
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
   * Returns the route components for the given row
   * @param row The user or contact
   */
  path(row: any): string[] {
    if (this.resultKind === 'contact') {
      // When supporting contact custom fields, check for
      // (this.data as ContactListDataForSearch).hasVisibleFields
      // to navigate to the contact edit page

      // Go to the contact profile
      return ['/users', 'contact-profile', this.user(row).id];
    }
    // Go to the user profile
    return ['/users', 'profile', this.user(row).id];
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
    const fieldsInList = this.fieldsInList;
    if (fieldsInList.length > 0) {
      // There are specific fields in list
      if (this.layout.xs) {
        // In mobile layout there's an aggregated column
        this.displayedColumns.next(['avatar', 'aggregated']);
      } else {
        // In other layouts show the specific columns, plus the avatar
        // As the columns cannot be dynamically defined, we define up to
        // 5 columns, named field0, field1, ...
        const fields: string[] = [];
        fields.push('avatar');
        if (this.resultKind === 'contact') {
          // For contacts, always show the user display as well
          fields.push('display');
        }
        for (let i = 0; i < this.fieldsInList.length; i++) {
          fields.push('field' + i);
        }
        this.displayedColumns.next(fields);
      }
    } else {
      // No specific fields - show the display only
      this.displayedColumns.next(['avatar', 'display']);
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
      this.mapFitBounds.next(rows == null ? null : fitBounds(rows.map(row => this.address(row))));
    }
    if (rows != null && this.mapReady) {
      this.notifyLoad();
    }
  }

  notifyLoad() {
    this.load.emit(null);
  }

  closeAllInfoWindows() {
    this.infoWindows.forEach(iw => iw.close());
  }

}
