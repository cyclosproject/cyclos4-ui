import { ChangeDetectionStrategy, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ContactListDataForSearch, ContactListQueryFilters, ContactResult } from 'app/api/models';
import { ContactsService } from 'app/api/services/contacts.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { ResultType } from 'app/ui/shared/result-type';
import { PickUserDialogComponent } from 'app/ui/users/search/pick-user-dialog.component';
import { UsersResultsComponent } from 'app/ui/users/search/users-results.component';
import { BsModalService } from 'ngx-bootstrap/modal';

type ContactListSearchParams = ContactListQueryFilters & { user: string; };

/**
 * Search the user's contact list
 */
@Component({
  selector: 'contact-list',
  templateUrl: 'contact-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactListComponent
  extends BaseSearchPageComponent<ContactListDataForSearch, ContactListSearchParams, ContactResult>
  implements OnInit {

  // Export enum to the template
  ResultType = ResultType;

  @ViewChild('usersResults') usersResults: UsersResultsComponent;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private contactsService: ContactsService,
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
    this.stateManager.cache('data',
      this.contactsService.getContactListDataForSearch({ user: ApiHelper.SELF })).subscribe(data => this.data = data);
  }

  protected toSearchParams(value: any): ContactListSearchParams {
    const params = value as ContactListSearchParams;
    params.user = ApiHelper.SELF;
    return value;
  }

  protected doSearch(value: ContactListSearchParams) {
    return this.contactsService.searchContactList$Response(value);
  }

  onDataInitialized(data: ContactListDataForSearch) {
    super.onDataInitialized(data);
    const fieldsInList = (data.fieldsInList || []).slice();
    if (!fieldsInList.includes('display')) {
      fieldsInList.unshift('display');
      data.fieldsInList = fieldsInList;
    }
    const auth = this.login.auth || {};
    const permissions = auth.permissions || {};
    const canAddContact = permissions.users?.search || permissions.banking?.payments?.user;
    // If can search or pay to other users, allow the add contacts dialog
    if (canAddContact) {
      this.headingActions = [
        new HeadingAction(SvgIcon.PlusCircle, this.i18n.general.addNew, () => this.addNew(), true),
      ];
    }
  }

  private addNew() {
    const canSearch = this.login.auth?.permissions?.users?.search;
    const ref = this.modal.show(PickUserDialogComponent, {
      class: 'modal-form',
      initialState: {
        excludeContacts: true,
        title: this.i18n.user.title.addContact,
        label: this.i18n.user.contact,
        allowSearch: canSearch
      }
    });
    const component = ref.content as PickUserDialogComponent;
    this.addSub(component.done.subscribe(user => {
      this.addSub(this.contactsService.createContact({
        user: ApiHelper.SELF,
        body: { contact: user.id }
      }).subscribe(() => {
        this.notification.snackBar(this.i18n.user.profile.addContactDone(user.display));
        this.reload();
      }));
    }));
  }

  resolveMenu(data: ContactListDataForSearch) {
    return this.menu.userMenu(data.user, Menu.CONTACTS);
  }
}
