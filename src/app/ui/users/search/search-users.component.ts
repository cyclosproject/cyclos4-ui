import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  BasicProfileFieldInput,
  Country, CustomFieldDetailed, RoleEnum, User, UserAddressResultEnum,
  UserDataForMap, UserDataForSearch, UserQueryFilters, UserStatusEnum
} from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { UsersService } from 'app/api/services/users.service';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { empty } from 'app/shared/helper';
import { MapsService } from 'app/ui/core/maps.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { CountriesResolve } from 'app/ui/countries.resolve';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { MaxDistance } from 'app/ui/shared/max-distance';
import { Menu } from 'app/ui/shared/menu';
import { ResultType } from 'app/ui/shared/result-type';
import { Observable } from 'rxjs';

export enum UserSearchKind {
  Public,
  Member,
  Admin,
  Broker,
}

/**
 * Search for users
 */
@Component({
  selector: 'search-users',
  templateUrl: 'search-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  customFieldsInSearch: CustomFieldDetailed[];
  basicFieldsInSearch: BasicProfileFieldInput[];
  fieldsInBasicSearch: any[];
  fieldsInAdvancedSearch: any[];

  constructor(
    injector: Injector,
    private usersService: UsersService,
    private userHelper: UserHelperService,
    private countriesResolve: CountriesResolve,
    private mapService: MapsService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['keywords', 'groups', 'customValues', 'distanceFilter', 'orderBy', 'statuses', 'beginActivationPeriod', 'endActivationPeriod',
      'beginCreationPeriod', 'endCreationPeriod', 'beginLastLoginPeriod', 'endLastLoginPeriod', 'notAcceptedAgreements',
      'acceptedAgreements', 'products', 'brokers', 'invitedBy', 'invitedByMe'];
  }

  getInitialResultType() {
    return this.doCanSearch() ? this.layout.xxs ? ResultType.LIST : ResultType.TILES : ResultType.MAP;
  }

  doCanSearch() {
    const usersSearch = this.login.auth?.permissions?.users?.search;
    return this.router.url.includes('brokerings') || (!this.dataForFrontendHolder.dataForUi.hideUserSearchInMenu && usersSearch);
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
    this.canSearch = this.kind === UserSearchKind.Broker || (users.search && !this.dataForFrontendHolder.dataForUi.hideUserSearchInMenu);
    this.canViewMap = publicOrMember && users.map && this.mapService.enabled;
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

    // Get data for search
    this.onResultTypeChanged(this.getInitialResultType() === ResultType.MAP ? ResultType.MAP : null, null);
  }

  get statusOptions(): FieldOption[] {
    const statuses = Object.values(UserStatusEnum) as UserStatusEnum[];
    return statuses.map(st => ({ value: st, text: this.userHelper.userStatus(st) }));
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
      if (resultType == null) {
        // Update default only first time
        this.resultType = this.getResultType(data.resultType);
      }
      this.doIgnoringUpdate(() => {
        this.customFieldsInSearch = [];
        this.basicFieldsInSearch = [];
        this.fieldsInBasicSearch = [];
        this.fieldsInAdvancedSearch = [];
        data.fieldsInBasicSearch.forEach(f => {
          var field: any = data.customFields.find(cf => cf.internalName === f);
          if (field) {
            this.customFieldsInSearch.push(field);
          } else {
            field = data.basicFields.find(bf => bf.field === f);
            this.basicFieldsInSearch.push(field);
          }
          this.fieldsInBasicSearch.push(field);
        });
        data.fieldsInAdvancedSearch.forEach(f => {
          var field: any = data.customFields.find(cf => cf.internalName === f);
          if (field) {
            this.customFieldsInSearch.push(field);
          } else {
            field = data.basicFields.find(bf => bf.field === f);
            this.basicFieldsInSearch.push(field);
          }
          this.fieldsInAdvancedSearch.push(field);
        });
        this.form.setControl('profileFields',
          this.fieldHelper.profileFieldsForSearchFormGroup(this.basicFieldsInSearch, this.customFieldsInSearch));
        if (!this.broker && data.broker) {
          this.broker = data.broker;
        }
        this.data = data;
        this.headingActions = [
          ...this.doShowMoreFilters() ? [] : [this.moreFiltersAction],
          ...this.exportHelper.headingActions(this.data.exportFormats, f => this.usersService.exportUsers$Response({
            format: f.internalName,
            ...this.toSearchParams(this.form.value)
          }))
        ];
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
          fromMenu: true,
          broker: this.kind === UserSearchKind.Broker ? this.param : null,
        })).subscribe(setData);
      }
    }
  }

  doShowMoreFilters() {
    return empty(this.data.fieldsInAdvancedSearch) && !this.byManager && !this.dataForFrontendHolder.auth?.permissions?.invite
      && this.data.searchByDistanceData;
  }

  get brokeringSearch() {
    return this.kind === UserSearchKind.Broker;
  }

  get byManager() {
    return [UserSearchKind.Broker, UserSearchKind.Admin].includes(this.kind);
  }

  protected toSearchParams(value: any): UserQueryFilters {
    const filters: UserQueryFilters = { ...value };
    if (this.brokeringSearch) {
      filters.brokers = [this.param];
    }
    filters.activationPeriod = ApiHelper.dateRangeFilter(value.beginActivationPeriod, value.endActivationPeriod);
    filters.creationPeriod = ApiHelper.dateRangeFilter(value.beginCreationPeriod, value.endCreationPeriod);
    filters.lastLoginPeriod = ApiHelper.dateRangeFilter(value.beginLastLoginPeriod, value.endLastLoginPeriod);

    filters.profileFields = this.fieldHelper.toProfileFieldsFilter(value.profileFields);

    if (value.invitedByMe) {
      filters.invitedBy = ApiHelper.SELF;
    }

    const distanceFilter: MaxDistance = value.distanceFilter;
    if (distanceFilter) {
      filters.maxDistance = distanceFilter.maxDistance;
      filters.latitude = distanceFilter.latitude;
      filters.longitude = distanceFilter.longitude;
    }
    // When searching as manager (admin / broker) the map is a simple map view, not the "map directory"
    const isMap = this.resultType === ResultType.MAP;
    filters.fromMenu = this.kind !== UserSearchKind.Broker;
    if (isMap) {
      filters.pageSize = 99999;
      filters.addressResult = UserAddressResultEnum.ALL;
    }
    return filters;
  }

  userSearchFilters(): UserQueryFilters {
    return { roles: [RoleEnum.BROKER] };
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
