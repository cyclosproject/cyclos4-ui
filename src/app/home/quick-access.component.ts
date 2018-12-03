import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';

export class QuickAccessAction {
  constructor(
    public icon: string,
    public label: string,
    public url: string[]
  ) { }
}

/**
 * Displays the quick access, which are links to common actions
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'quick-access',
  templateUrl: 'quick-access.component.html',
  styleUrls: ['quick-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAccessComponent extends BaseComponent implements OnInit {

  actions: QuickAccessAction[];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.actions = [];
    const dataForUi = this.dataForUiHolder.dataForUi;
    const auth = dataForUi.auth;
    const permissions = auth.permissions;
    if (permissions.banking) {
      const accounts = permissions.banking.accounts;
      for (const account of accounts) {
        if (account.visible) {
          const type = account.account.type;
          const label = accounts.length === 1 ? this.i18n('Account') : type.name;
          this.actions.push(new QuickAccessAction('account', label, ['banking', 'account', ApiHelper.internalNameOrId(type)]));
        }
      }
      if (permissions.banking.payments.user) {
        this.actions.push(new QuickAccessAction('pay', this.i18n('Pay user'), ['banking', 'payment']));
      }
    }
    if (permissions.contacts && (permissions.contacts.enable)) {
      this.actions.push(new QuickAccessAction('contact_list', this.i18n('Contacts'), ['users', 'contacts']));
    }
    if (permissions.users && (permissions.users.search || permissions.users.map)) {
      this.actions.push(new QuickAccessAction('search_users', this.i18n('Directory'), ['users', 'search']));
    }
    if (permissions.marketplace && permissions.marketplace.search) {
      this.actions.push(new QuickAccessAction('marketplace', this.i18n('Advertisements'), ['marketplace', 'search']));
    }
    if (permissions.myProfile && permissions.myProfile.editProfile) {
      this.actions.push(new QuickAccessAction('edit_profile', this.i18n('Edit profile'), ['users', 'my-profile', 'edit']));
    }
    if (auth.user == null) {
      this.actions.push(new QuickAccessAction('login', this.i18n('Login'), ['login']));
      if (!empty(dataForUi.publicRegistrationGroups)) {
        this.actions.push(new QuickAccessAction('register', this.i18n('Register'), ['users', 'registration']));
      }
    }
  }

}
