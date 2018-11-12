import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Injector, Input, Output, OnInit } from '@angular/core';
import { Address, ContactListDataForSearch, ContactResult, User, UserDataForMap, UserDataForSearch, UserResult } from 'app/api/models';
import { BaseComponent } from 'app/shared/base.component';
import { PageData } from 'app/shared/page-data';
import { PagedResults } from 'app/shared/paged-results';
import { ResultType } from 'app/shared/result-type';
import { BehaviorSubject } from 'rxjs';

const MAX_COLUMNS = 7;
const MAX_TILE_FIELDS = 2;

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

  @Input() resultKind: 'user' | 'contact' = 'user';

  @Output() update = new EventEmitter<PageData>();

  fieldsInList: string[];
  fieldsInTile: string[];
  showTableHeader: boolean;
  canViewProfile: boolean;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const auth = this.dataForUiHolder.dataForUi.auth || {};
    const permissions = auth.permissions || {};
    const users = (permissions.users || {});
    this.canViewProfile = users.viewProfile === true;
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
   * Returns a function that formats the user
   */
  displayFunction(): Function {
    return row => {
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
   * Returns the display name of the given field
   * @param field The field identifier
   */
  fieldName(field: string): string {
    switch (field) {
      case 'display':
        return this.i18n('User');
      case 'name':
        return this.i18n('Full name');
      case 'username':
        return this.i18n('Login name');
      case 'email':
        return this.i18n('E-mail');
      case 'phone':
        return this.i18n('Phone number');
      case 'accountNumber':
        return this.i18n('Account number');
      default:
        const customField = this.data.customFields.find(cf => cf.internalName === field);
        return (customField || {}).name;
    }
  }

  /**
   * Returns the route components for the given row
   * @param row The user or contact
   */
  path(row: any): string[] {
    if (!this.canViewProfile) {
      return null;
    }
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
}
