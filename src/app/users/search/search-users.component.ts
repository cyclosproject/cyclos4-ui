import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Country, CustomFieldDetailed, UserDataForMap, UserDataForSearch } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { UsersService } from 'app/api/services';
import { FieldHelperService } from 'app/core/field-helper.service';
import { CountriesResolve } from 'app/countries.resolve';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
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
  // Hence, we need to control the update externally.
  // See https://github.com/angular/angular/issues/20439
  ignoreNextUpdate = false;

  constructor(
    injector: Injector,
    private fieldHelper: FieldHelperService,
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
    return ['keywords', 'customValues', 'orderBy'];
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

  doSearch(query) {
    const value = cloneDeep(query);
    value.profileFields = this.fieldHelper.toCustomValuesFilter(query.customValues);
    delete value.customValues;
    return this.resultType === ResultType.MAP
      ? this.usersService.searchMapDirectoryResponse(value)
      : this.usersService.searchUsersResponse(value);
  }
}
