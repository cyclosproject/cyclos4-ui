import { ChangeDetectionStrategy, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ContactListDataForSearch, ContactResult } from 'app/api/models';
import { ContactsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { ResultType } from 'app/shared/result-type';
import { UsersResultsComponent } from 'app/users/search/users-results.component';

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
