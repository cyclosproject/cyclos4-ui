import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Injector,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  Address,
  BaseUserDataForSearch,
  ContactListDataForSearch,
  ContactResult,
  User,
  UserDataForMap,
  UserDataForSearch,
  UserResult
} from 'app/api/models';
import { OperatorResult } from 'app/api/models/operator-result';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { PagedResults } from 'app/shared/paged-results';
import { MaxDistance } from 'app/ui/shared/max-distance';
import { PageData } from 'app/ui/shared/page-data';
import { ResultType } from 'app/ui/shared/result-type';
import { BehaviorSubject } from 'rxjs';

export const MAX_COLUMNS = 7;
export const MAX_TILE_FIELDS = 2;

/**
 * Displays the results of a user search
 */
@Component({
  selector: 'users-results',
  templateUrl: 'users-results.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersResultsComponent extends BaseComponent implements OnInit {
  @HostBinding('class') clazz = 'flex-grow-1 d-flex';

  @Input() resultType: ResultType;
  @Input() rendering$: BehaviorSubject<boolean>;
  @Input() referencePoint: MaxDistance;

  private _data: UserDataForSearch | UserDataForMap | ContactListDataForSearch;
  @Input() set data(data: UserDataForSearch | UserDataForMap | ContactListDataForSearch) {
    this._data = data;
    const fieldsInList = (data || {}).fieldsInList || [];
    this.fieldsInList = fieldsInList.slice(0, Math.min(fieldsInList.length, MAX_COLUMNS));
    this.fieldsInTile = fieldsInList.slice(0, Math.min(fieldsInList.length, MAX_TILE_FIELDS));
    this.showTableHeader = this.fieldsInList.length > 1;
  }
  get data(): UserDataForSearch | UserDataForMap | ContactListDataForSearch {
    return this._data;
  }

  @Input() results: PagedResults<UserResult | ContactResult>;

  @Input() resultKind: 'user' | 'operator' | 'contact' = 'user';

  @Input() removeAction: (user: UserResult | ContactResult) => void;

  @Output() update = new EventEmitter<PageData>();

  fieldsInList: string[];
  fieldsInTile: string[];
  showTableHeader: boolean;
  canViewProfile: boolean;

  constructor(injector: Injector, private authHelper: AuthHelperService, private fieldHelper: FieldHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const auth = this.dataForFrontendHolder.auth || {};
    const permissions = auth.permissions || {};
    const users = permissions.users || {};
    this.canViewProfile = users.viewProfile === true || this.resultKind === 'operator';
  }

  /**
   * Returns the user displayed for the given result row
   * @param row The result from the search
   */
  user(row: any): User {
    if (this.resultKind === 'contact') {
      return (row as ContactResult).contact;
    }
    return row as User;
  }

  /**
   * Returns the operator group
   * @param row The operator group
   */
  operatorGroup(row: any): string {
    if (this.resultKind === 'operator') {
      const group = (row as OperatorResult).group;
      if (group) {
        return group.name;
      } else {
        return this.i18n.user.operatorNoGroup;
      }
    }
    return null;
  }
  /**
   * Returns a function that formats the user
   */
  displayFunction(): (row: any) => any {
    return (row: any) => {
      const user = this.user(row);
      if (user.display) {
        return user.display;
      }
      // Is a user result
      const res = user as UserResult;
      const field = this.fieldsInList[0];
      if (res.hasOwnProperty(field)) {
        return res[field];
      }
      return (res.customValues || {})[field];
    };
  }

  /**
   * Returns the custom values holder for the given result row
   * @param row The result from the search
   */
  customValues(row: any): any {
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
  address(row: any): Address {
    if (this.resultKind === 'contact') {
      return null;
    }
    return (row as UserResult).address;
  }

  /**
   * Returns the display name of the given field
   * @param field The field identifier
   */
  fieldName(field: string): string {
    if (this.resultKind === 'operator' && field === 'display') {
      return this.i18n.general.operator;
    }
    return this.fieldHelper.fieldDisplay(field, this.data.customFields);
  }

  /**
   * Returns the route components for the given row
   * @param row The user or contact
   */
  path(row: any): string[] {
    const user = this.user(row);
    if (this.authHelper.isSelf(user)) {
      // Go to my profile
      return ['/users', this.ApiHelper.SELF, 'profile'];
    }
    if (this.resultKind === 'operator') {
      // Go to the operator profile
      return ['/users', 'operators', user.id];
    }
    if (!this.canViewProfile) {
      return null;
    }
    if (this.resultKind === 'contact') {
      // When supporting contact custom fields, check for
      // (this.data as ContactListDataForSearch).hasVisibleFields
      // to navigate to the contact edit page

      // Go to the contact profile
      return ['/users', 'contacts', user.id];
    }
    // Go to the user profile
    return ['/users', user.id, 'profile'];
  }

  get toLink() {
    return (row: any) => this.path(row);
  }

  /**
   * Returns if the user can view images so the avatar columns is displayed
   */
  get canViewImages(): boolean {
    return this.data != null && (this.data as BaseUserDataForSearch).canViewImages;
  }

  /**
   * Returns the fields in tile that have an actual value
   */
  fieldsWithValue(row: any): string[] {
    const user = this.user(row);
    const customValues = this.customValues(row);
    const allValues = { ...user, ...customValues };
    const fields = (this.fieldsInTile || []).filter(f => this.fieldHelper.hasValue(f, allValues));
    return fields;
  }

  /**
   * Returns an array with the number of elements corresponding to the number of blank spaces that should be added to the tile
   */
  blankSpaces(withValue: string[]): string[] {
    const times = (this.fieldsInList || []).length - (withValue || []).length;
    const result: string[] = [];
    for (let i = 0; i < times; i++) {
      result.push('');
    }
    return result;
  }
}
