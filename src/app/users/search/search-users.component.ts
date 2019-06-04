import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Country, CustomFieldDetailed, UserDataForMap, UserDataForSearch } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { UsersService } from 'app/api/services';
import { CountriesResolve } from 'app/countries.resolve';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { MaxDistance } from 'app/shared/max-distance';
import { ResultType } from 'app/shared/result-type';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';


/**
 * Search for users
 */
@Component({
  selector: 'search-users',
  templateUrl: 'search-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUsersComponent
  extends BaseSearchPageComponent<UserDataForSearch | UserDataForMap, UserResult> implements OnInit {

  // Export enum to the template
  ResultType = ResultType;
  empty = empty;

  canSearch: boolean;
  canViewMap: boolean;
  countries$: Observable<Country[]>;
  basicField$ = new BehaviorSubject<CustomFieldDetailed>(null);
  advancedFields$ = new BehaviorSubject<CustomFieldDetailed[]>([]);

  // As the custom fields are dynamically fetched, and form.setControl doesn't have a way to avoid emitting the value.
  // Hence, we need to avoid the extra page update manually.
  // See https://github.com/angular/angular/issues/20439
  private ignoreNextUpdate = false;

  private firstTime = true;

  constructor(
    injector: Injector,
    private usersService: UsersService,
    countriesResolve: CountriesResolve
  ) {
    super(injector);

    // Get the permissions to search users and view map directory
    const permissions = this.login.permissions || {};
    const users = permissions.users || {};
    this.canSearch = !!users.search;
    this.canViewMap = !!users.map;
    if (!this.canSearch && !this.canViewMap) {
      this.errorHandler.handleForbiddenError({});
      return;
    }
    const allowedResultTypes = [];
    if (this.canSearch) {
      allowedResultTypes.push(ResultType.TILES);
      allowedResultTypes.push(ResultType.LIST);
    }
    if (this.canViewMap) {
      allowedResultTypes.push(ResultType.MAP);
    }
    this.allowedResultTypes = allowedResultTypes;

    this.countries$ = countriesResolve.data;
  }

  shouldUpdateOnChange(value: any): boolean {
    if (this.ignoreNextUpdate) {
      this.ignoreNextUpdate = false;
      return false;
    }
    return super.shouldUpdateOnChange(value);
  }

  protected getFormControlNames() {
    return ['keywords', 'groups', 'customValues', 'distanceFilter', 'orderBy'];
  }

  getInitialResultType() {
    return this.layout.xxs ? ResultType.LIST : ResultType.TILES;
  }

  ngOnInit() {
    super.ngOnInit();
    this.onResultTypeChanged(this.resultType, null);
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
      // See the comment on ignoreNextUpdate
      this.ignoreNextUpdate = true;
      this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(fieldsInSearch, {
        useDefaults: false
      }));
      if (this.firstTime) {
        const defaultQuery = data.query || {};
        this.form.patchValue(defaultQuery);
        if (defaultQuery.maxDistance || defaultQuery.latitude || defaultQuery.longitude) {
          // Here the distanceFilter is a MaxDistance, but the query has the distance properties directly
          this.form.get('distanceFilter').patchValue(defaultQuery);
        }
        this.firstTime = false;
      }
      this.ignoreNextUpdate = false;
      this.basicField$.next(fieldsInSearch.length === 0 ? null : fieldsInSearch[0]);
      this.advancedFields$.next(fieldsInSearch.length > 1 ? fieldsInSearch.slice(1) : []);
      this.data = data;
      this.headingActions = empty(this.advancedFields$.value) ? [] : [this.moreFiltersAction];
    };

    if (this.data == null) {
      this.rendering = true;
      if (isMap) {
        // Get data for showing the map
        this.stateManager.cache('dataForMap', this.usersService.getDataForMapDirectory())
          .subscribe(setData);
      } else {
        // Get the data for regular user search
        this.stateManager.cache('dataForSearch', this.usersService.getUserDataForSearch())
          .subscribe(setData);
      }
    }
  }

  doSearch(query: any) {
    const value = cloneDeep(query);
    value.profileFields = this.fieldHelper.toCustomValuesFilter(query.customValues);
    delete value.customValues;
    const distanceFilter: MaxDistance = value.distanceFilter;
    if (distanceFilter) {
      value.maxDistance = distanceFilter.maxDistance;
      value.latitude = distanceFilter.latitude;
      value.longitude = distanceFilter.longitude;
    }
    return this.resultType === ResultType.MAP
      ? this.usersService.searchMapDirectory$Response(value)
      : this.usersService.searchUsers$Response(value);
  }
}
