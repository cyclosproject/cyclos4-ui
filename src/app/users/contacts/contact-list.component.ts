import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import { UsersService, ContactsService } from 'app/api/services';
import { ContactListDataForSearch, ContactResult } from 'app/api/models';
import { UserResult } from 'app/api/models/user-result';
import { ResultType } from 'app/shared/result-type';

/**
 * Search for contacts
 */
@Component({
  selector: 'contact-list',
  templateUrl: 'contact-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactListComponent extends BaseComponent {

  data: ContactListDataForSearch;

  renderingResults = new BehaviorSubject(true);

  form: FormGroup;
  resultType: FormControl;

  query: any;
  dataSource = new TableDataSource<ContactResult>();
  loaded = new BehaviorSubject(false);

  // Export enum to the template
  ResultType = ResultType;

  constructor(
    injector: Injector,
    private contactsService: ContactsService,
    formBuilder: FormBuilder
  ) {
    super(injector);
    this.form = formBuilder.group({
      resultType: ResultType.TILES,
      keywords: null,
      customValues: null
    });
    this.resultType = formBuilder.control(ResultType.TILES);
    this.resultType.valueChanges.subscribe(() => this.renderingResults.next(true));
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

    // Get the data for user search
    this.stateManager.cache('data',
      this.contactsService.getContactListDataForSearch({
        user: ApiHelper.SELF
      }))
      .subscribe(data => {
        this.data = data;

        // Initialize the query
        this.query = this.stateManager.get('query', () => {
          return data.query;
        });
        this.query.user = ApiHelper.SELF;

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
    const results = this.contactsService.searchContactListResponse(this.query).pipe(
      tap(response => {
        this.loaded.next(true);
        // When no rows state that results are not being rendered
        if (response.body.length === 0) {
          this.renderingResults.next(false);
        }
      }));
    this.dataSource.subscribe(results);
  }

}
