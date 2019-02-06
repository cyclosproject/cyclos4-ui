import { ChangeDetectionStrategy, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ContactListDataForSearch, ContactResult } from 'app/api/models';
import { ContactsService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { ResultType } from 'app/shared/result-type';
import { UsersResultsComponent } from 'app/users/search/users-results.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AddContactDialogComponent } from 'app/users/search/add-contact-dialog.component';

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
    private modal: BsModalService,
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
      this.headingActions = [
        new HeadingAction('add', this.messages.general.addNew, () => this.addNew(), true)
      ];
      this.data = data;
    });
  }

  doSearch(value) {
    return this.contactsService.searchContactList$Response(value);
  }

  private addNew() {
    const ref = this.modal.show(AddContactDialogComponent, {
      class: 'modal-form'
    });
    const component = ref.content as AddContactDialogComponent;
    this.addSub(component.done.subscribe(user => {
      this.notification.snackBar(this.messages.user.profile.addContactDone(user.display));
      this.reload();
    }));

  }
}
