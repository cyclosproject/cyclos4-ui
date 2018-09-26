import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { UsersService } from 'app/api/services';
import { UserDataForSearch, UserDataForMap, Country, CustomFieldDetailed } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { ResultType } from 'app/shared/result-type';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { CountriesResolve } from 'app/countries.resolve';
import { Observable, BehaviorSubject } from 'rxjs';
import { empty } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';
import { cloneDeep } from 'lodash';

/**
 * Search for users
 */
@Component({
  selector: 'search-users',
  templateUrl: 'search-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUsersComponent
  extends BaseSearchPageComponent<UserDataForSearch | UserDataForMap, UserResult> {

  // Export enum to the template
  ResultType = ResultType;
  empty = empty;

  canSearch: boolean;
  canViewMap: boolean;
  allowedResultTypes: ResultType[];
  countries$: Observable<Country[]>;
  fieldsInSearch$ = new BehaviorSubject<CustomFieldDetailed[]>([]);

  // As the custom fields are dynamically fetched, and form.setControl doesn't have a way to avoid emitting the value.
  // Hence, we need to control the update externally.
  // See https://github.com/angular/angular/issues/20439
  ignoreNextUpdate = false;

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
    this.allowedResultTypes = [];
    if (this.canSearch) {
      this.allowedResultTypes.push(ResultType.TILES);
      this.allowedResultTypes.push(ResultType.LIST);
    }
    if (this.canViewMap) {
      this.allowedResultTypes.push(ResultType.MAP);
    }

    this.countries$ = countriesResolve.data;
  }

  shouldUpdateOnChange(value: any, previousValue: any): boolean {
    if (this.ignoreNextUpdate) {
      this.ignoreNextUpdate = false;
      return false;
    }
    return super.shouldUpdateOnChange(value, previousValue);
  }

  protected getFormControlNames() {
    return ['keywords', 'customValues', 'orderBy'];
  }

  getInitialResultType() {
    return this.layout.xxs ? ResultType.LIST : ResultType.TILES;
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
      this.form.setControl('customValues', ApiHelper.customValuesFormGroup(this.formBuilder, fieldsInSearch));
      this.fieldsInSearch$.next(fieldsInSearch);
      this.data = data;
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

  doSearch(query) {
    const value = cloneDeep(query);
    value.profileFields = ApiHelper.toCustomValuesFilter(query.customValues);
    delete value.customValues;
    return this.resultType === ResultType.MAP
      ? this.usersService.searchMapDirectoryResponse(value)
      : this.usersService.searchUsersResponse(value);
  }
}
