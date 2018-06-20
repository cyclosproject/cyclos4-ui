import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import { UsersService } from 'app/api/services';
import { UserDataForSearch } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { ResultType } from 'app/shared/result-type';

/**
 * Displays the account history of a given account
 */
@Component({
  selector: 'search-users',
  templateUrl: 'search-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUsersComponent extends BaseComponent {

  static MAX_COLUMNS = 7;
  static MAX_TILE_FIELDS = 3;

  constructor(
    injector: Injector,
    private usersService: UsersService,
    formBuilder: FormBuilder
  ) {
    super(injector);
    this.form = formBuilder.group({
      resultType: ResultType.TILES,
      keywords: null,
      customValues: null
    });
    this.resultType = formBuilder.control(ResultType.TILES);
    this.form.setControl('resultType', this.resultType);

    this.stateManager.manage(this.form);
    this.subscriptions.push(this.form.valueChanges.pipe(
      debounceTime(ApiHelper.DEBOUNCE_TIME)
    ).subscribe(value => {
      this.update(value);
    }));
  }

  data: UserDataForSearch;

  form: FormGroup;
  resultType: FormControl;

  query: any;
  dataSource = new TableDataSource<UserResult>();
  loaded = new BehaviorSubject(false);
  displayedColumns = new BehaviorSubject<string[]>([]);

  // Export enum to the template
  ResultType = ResultType;

  ngOnInit() {
    super.ngOnInit();

    // Get the data for user search
    this.stateManager.cache('data',
      this.usersService.getUserDataForSearch())
      .subscribe(data => {
        this.data = data;
        this.updateDisplayedColumns();

        // Initialize the query
        this.query = this.stateManager.get('query', () => {
          return data.query;
        });

        // Perform the search
        this.update();
      });
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
    const results = this.usersService.searchUsersResponse(this.query).pipe(
      tap(response => {
        this.loaded.next(true);
      }));
    this.dataSource.subscribe(results);
  }

  /**
   * Returns the identifiers of fields to show in the result list
   */
  get fieldsInList(): string[] {
    let arr = (this.data || {}).fieldsInList || [];
    if (arr.length > SearchUsersComponent.MAX_COLUMNS) {
      arr = arr.slice(0, SearchUsersComponent.MAX_COLUMNS);
    }
    return arr;
  }

  /**
   * Returns the identifiers of fields to show in tiled view
   */
  get fieldsInTile(): string[] {
    let arr = (this.data || {}).fieldsInList || [];
    if (arr.length > SearchUsersComponent.MAX_TILE_FIELDS) {
      arr = arr.slice(0, SearchUsersComponent.MAX_TILE_FIELDS);
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
   * Returns the route components for the given user
   * @param user The user
   */
  path(user: UserResult): string[] {
    return ['/users', 'profile', user.id];
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

  onDisplayChange() {
    super.onDisplayChange();
    this.updateDisplayedColumns();
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

}
