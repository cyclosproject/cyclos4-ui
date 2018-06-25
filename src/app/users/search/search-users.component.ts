import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import { UsersService } from 'app/api/services';
import { UserDataForSearch, UserDataForMap } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { ResultType } from 'app/shared/result-type';
import { UsersResultsComponent } from 'app/users/search/users-results.component';

/**
 * Search for users
 */
@Component({
  selector: 'search-users',
  templateUrl: 'search-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUsersComponent extends BaseComponent {

  // Export enum to the template
  ResultType = ResultType;

  data = new BehaviorSubject<UserDataForSearch | UserDataForMap>(null);

  form: FormGroup;
  resultType: FormControl;
  previousResultType = ResultType.TILES;

  query: any;
  dataSource = new TableDataSource<UserResult>();
  loaded = new BehaviorSubject(false);

  @ViewChild('results') results: UsersResultsComponent;

  constructor(
    injector: Injector,
    private usersService: UsersService,
    formBuilder: FormBuilder
  ) {
    super(injector);
    this.form = formBuilder.group({
      resultType: this.previousResultType,
      keywords: null,
      customValues: null
    });
    this.resultType = formBuilder.control(this.previousResultType);
    this.resultType.valueChanges.subscribe(rt => this.updateResultType(rt));
    this.form.setControl('resultType', this.resultType);

    this.stateManager.manage(this.form);
    this.subscriptions.push(this.form.valueChanges.pipe(
      debounceTime(ApiHelper.DEBOUNCE_TIME)
    ).subscribe(value => {
      this.update(value);
    }));
  }

  ngOnInit() {
    super.ngOnInit();

    this.updateResultType(this.previousResultType, true);
  }

  update(value?: any) {
    if (value == null) {
      value = this.form.value;
    }
    if (value) {
      // Update the query from the current form value
      this.query.keywords = value.keywords;
    }

    // Update the results
    const search = this.resultType.value === ResultType.MAP
      ? this.usersService.searchMapDirectoryResponse(this.query)
      : this.usersService.searchUsersResponse(this.query);
    const results = search.pipe(
      tap(response => {
        this.loaded.next(true);
        this.layout.fullHeightContent.next(response.body.length > 0 && this.resultType.value === ResultType.MAP);
      }));
    this.dataSource.subscribe(results);
  }

  private updateResultType(resultType: ResultType, force = false) {
    const isMap = resultType === ResultType.MAP;
    const wasMap = this.previousResultType === ResultType.MAP;
    if (isMap !== wasMap || force) {
      // Have to reload the data
      this.loaded.next(false);
      this.data.next(null);
      if (this.query) {
        // When changing between map / no-map, reset the page
        this.query.page = 0;
        this.query.pageSize = null;
      }
    }
    const afterData = (data: UserDataForSearch | UserDataForMap) => {
      this.data.next(data);
      // Initialize the query
      this.query = this.stateManager.get('query', () => {
        return data.query;
      });
      // Perform the search
      this.update();
    };
    if (isMap && !wasMap || force && isMap) {
      // Get data for showing the map
      this.stateManager.cache('dataForMap',
        this.usersService.getDataForMapDirectory()).subscribe(afterData);
    } else if (!isMap && wasMap || force && !isMap) {
      // Get the data for user search
      this.stateManager.cache('data',
        this.usersService.getUserDataForSearch()).subscribe(afterData);
    }
    this.previousResultType = resultType;
  }
}
