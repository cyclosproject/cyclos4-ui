import { Component, ChangeDetectionStrategy, Injector, ViewChild, OnInit } from '@angular/core';

import { ContactsService } from 'app/api/services';
import { ContactListDataForSearch, ContactResult, Country } from 'app/api/models';
import { ResultType } from 'app/shared/result-type';
import { UsersResultsComponent } from 'app/users/search/users-results.component';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { ApiHelper } from 'app/shared/api-helper';
import { CountriesResolve } from 'app/countries.resolve';
import { Observable } from 'rxjs';

/**
 * Search the user's contact list
 */
@Component({
  selector: 'contact-list',
  templateUrl: 'contact-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactListComponent
  extends BaseSearchPageComponent<ContactListDataForSearch, ContactResult>
  implements OnInit {

  // Export enum to the template
  ResultType = ResultType;

  @ViewChild('usersResults') usersResults: UsersResultsComponent;

  constructor(
    injector: Injector,
    private contactsService: ContactsService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['user', 'keywords'];
  }

  getInitialResultType() {
    return this.layout.xxs ? ResultType.LIST : ResultType.TILES;
  }

  ngOnInit() {
    super.ngOnInit();
    this.allowedResultTypes = [ResultType.TILES, ResultType.LIST];
    this.form.patchValue({ 'user': ApiHelper.SELF }, { emitEvent: false });
    this.stateManager.cache('data', this.contactsService.getContactListDataForSearch({
      user: ApiHelper.SELF
    })).subscribe(data => {
      const fieldsInList = (data.fieldsInList || []).slice();
      if (!fieldsInList.includes('display')) {
        fieldsInList.unshift('display');
        data.fieldsInList = fieldsInList;
      }
      this.data = data;
    });
  }

  doSearch(value) {
    return this.contactsService.searchContactListResponse(value);
  }
}
