import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  Country, CustomFieldDetailed, RoleEnum, UserAddressResultEnum, UserDataForMap,
  UserDataForSearch, User, UserQueryFilters
} from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { UsersService } from 'app/api/services';
import { CountriesResolve } from 'app/countries.resolve';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { MaxDistance } from 'app/shared/max-distance';
import { ResultType } from 'app/shared/result-type';
import { BehaviorSubject, Observable } from 'rxjs';
import { Menu } from 'app/shared/menu';

export enum UserSearchKind {
  Public,
  Member,
  Admin,
  Broker
}

/**
 * Search for users
 */
@Component({
  selector: 'search-users',
  templateUrl: 'search-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUsersComponent
  extends BaseSearchPageComponent<UserDataForSearch | UserDataForMap, UserQueryFilters, UserResult> implements OnInit {

  // Export enum to the template
  ResultType = ResultType;
  UserSearchKind = UserSearchKind;
  empty = empty;

  kind: UserSearchKind;
  manager: boolean;
  param: string;
  self: boolean;
  broker: User;
  heading: string;
  mobileHeading: string;

  canSearch: boolean;
  canViewMap: boolean;
  countries$: Observable<Country[]>;
  basicField$ = new BehaviorSubject<CustomFieldDetailed>(null);
  advancedFields$ = new BehaviorSubject<CustomFieldDetailed[]>([]);

  constructor(
    injector: Injector,
    private usersService: UsersService,
    private countriesResolve: CountriesResolve
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['keywords', 'groups', 'customValues', 'distanceFilter', 'orderBy'];
  }

  getInitialResultType() {
    return this.layout.xxs ? ResultType.LIST : ResultType.TILES;
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.user || ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.param);

    const auth = this.login.auth;
    const role = auth == null ? null : auth.role;

    // Determine the search kind
    const url = this.router.url;
    if (url.includes('search')) {
      if (role == null) {
        this.kind = UserSearchKind.Public;
      } else if (role === RoleEnum.ADMINISTRATOR) {
        this.kind = UserSearchKind.Admin;
      } else {
        this.kind = UserSearchKind.Member;
      }
    } else if (url.includes('brokerings')) {
      this.kind = UserSearchKind.Broker;
    }
    this.manager = [UserSearchKind.Admin, UserSearchKind.Broker].includes(this.kind);
    const publicOrMember = [UserSearchKind.Public, UserSearchKind.Member].includes(this.kind);

    // Set the correct title
    if (publicOrMember) {
      this.heading = this.i18n.user.title.directory;
      this.mobileHeading = this.i18n.user.mobileTitle.directory;
    } else if (this.kind === UserSearchKind.Broker) {
      if (this.self) {
        this.heading = this.i18n.user.title.myBrokerings;
        this.mobileHeading = this.i18n.user.mobileTitle.myBrokerings;
      } else {
        this.heading = this.i18n.user.title.userBrokerings;
        this.mobileHeading = this.i18n.user.mobileTitle.userBrokerings;
      }
    } else if (this.kind === UserSearchKind.Admin) {
      this.heading = this.i18n.user.title.search;
      this.mobileHeading = this.i18n.user.mobileTitle.search;
    }

    // Get the permissions to search users and view map directory
    const permissions = (auth || {}).permissions || {};
    const users = permissions.users || {};
    this.canSearch = this.kind === UserSearchKind.Broker || !!users.search;
    this.canViewMap = publicOrMember && users.map;
    if (!this.canSearch && !this.canViewMap) {
      this.errorHandler.handleForbiddenError({});
      return;
    }
    const allowedResultTypes = [];
    if (this.canSearch) {
      allowedResultTypes.push(ResultType.TILES);
      allowedResultTypes.push(ResultType.LIST);
    }
    if (this.canViewMap || this.manager) {
      allowedResultTypes.push(ResultType.MAP);
    }
    this.allowedResultTypes = allowedResultTypes;

    this.countries$ = this.countriesResolve.data;

    this.onResultTypeChanged(this.resultType, null);
  }

  /**
   * Never update automatically on result type change - we'll do it manually
   */
  shouldUpdateOnResultTypeChange() {
    return false;
  }

  protected onResultTypeChanged(resultType: ResultType, previousResultType: ResultType) {
    const isMap = resultType === ResultType.MAP;
    const wasMap = previousResultType === ResultType.MAP;
    const force = previousResultType == null;
    if (isMap !== wasMap || force) {
      // Have to reload the data, or load the data for the first time
      this.data = null;

      // When changing between map / no-map, reset the page
      this.resetPage();
    }

    const setData = (data: UserDataForSearch | UserDataForMap) => {
      if (empty(data.fieldsInList)) {
        // When there are no fields in list, set the display
        data.fieldsInList = ['display'];
      }
      const fieldsInSearch = data.customFields.filter(cf => data.fieldsInSearch.includes(cf.internalName));
      this.doIgnoringUpdate(() => {
        this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(fieldsInSearch, {
          useDefaults: false
        }));
        this.basicField$.next(fieldsInSearch.length === 0 ? null : fieldsInSearch[0]);
        this.advancedFields$.next(fieldsInSearch.length > 1 ? fieldsInSearch.slice(1) : []);
        if (!this.broker && data.broker) {
          this.broker = data.broker;
        }
        this.data = data;
        this.headingActions = empty(this.advancedFields$.value) ? [] : [this.moreFiltersAction];
      });
    };

    if (this.data == null) {
      this.rendering = true;
      // When searching as manager (admin / broker) the map is a simple map view, not the "map directory"
      if (isMap && !this.manager) {
        // Get data for showing the map
        this.stateManager.cache('dataForMap', this.usersService.getDataForMapDirectory())
          .subscribe(setData);
      } else {
        // Get the data for regular user search
        this.stateManager.cache('dataForSearch', this.usersService.getUserDataForSearch({
          broker: this.kind === UserSearchKind.Broker ? this.param : null
        })).subscribe(setData);
      }
    }
  }

  protected toSearchParams(value: any): UserQueryFilters {
    const filters: UserQueryFilters = value;
    if (this.kind === UserSearchKind.Broker) {
      filters.brokers = [this.param];
    }
    filters.profileFields = this.fieldHelper.toCustomValuesFilter(value.customValues);
    const distanceFilter: MaxDistance = value.distanceFilter;
    if (distanceFilter) {
      filters.maxDistance = distanceFilter.maxDistance;
      filters.latitude = distanceFilter.latitude;
      filters.longitude = distanceFilter.longitude;
    }
    // When searching as manager (admin / broker) the map is a simple map view, not the "map directory"
    const isMap = this.resultType === ResultType.MAP;
    if (isMap) {
      filters.pageSize = 99999;
      filters.addressResult = UserAddressResultEnum.ALL;
    }
    return filters;
  }

  doSearch(query: UserQueryFilters) {
    // When searching as manager (admin / broker) the map is a simple map view, not the "map directory"
    const isMap = this.resultType === ResultType.MAP;
    return isMap && !this.manager
      ? this.usersService.searchMapDirectory$Response(query)
      : this.usersService.searchUsers$Response(query);
  }

  resolveMenu() {
    switch (this.kind) {
      case UserSearchKind.Broker:
        return Menu.MY_BROKERED_USERS;
      case UserSearchKind.Public:
        return Menu.PUBLIC_DIRECTORY;
      default:
        return Menu.SEARCH_USERS;
    }
  }
}
