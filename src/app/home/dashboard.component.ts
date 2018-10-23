import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';

export class DashboardAction {
  constructor(
    public icon: string,
    public label: string,
    public url: string[]
  ) { }
}

/**
 * Displays the dashboard, which are shortcuts to actions in the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent extends BaseComponent implements OnInit {

  actions: DashboardAction[];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.actions = [];
    const dataForUi = this.dataForUiHolder.dataForUi;
    const auth = dataForUi.auth;
    const permissions = auth.permissions;
    if (auth.user == null) {
      this.actions.push(new DashboardAction('login', this.i18n('Login'), ['login']));
      if (!empty(dataForUi.publicRegistrationGroups)) {
        this.actions.push(new DashboardAction('register', this.i18n('Register'), ['users', 'registration']));
      }
    }
    if (permissions.banking) {
      const accounts = permissions.banking.accounts;
      for (const account of accounts) {
        if (account.visible) {
          const type = account.account.type;
          const label = accounts.length === 1 ? this.i18n('Account') : type.name;
          this.actions.push(new DashboardAction('account', label, ['banking', 'account', ApiHelper.internalNameOrId(type)]));
        }
      }
      if (permissions.banking.payments.user) {
        this.actions.push(new DashboardAction('pay', this.i18n('Pay user'), ['banking', 'payment']));
      }
    }
    if (permissions.users && (permissions.users.search || permissions.users.map)) {
      this.actions.push(new DashboardAction('search_users', this.i18n('Users'), ['users', 'search']));
    }
    if (permissions.marketplace && permissions.marketplace.search) {
      this.actions.push(new DashboardAction('marketplace', this.i18n('Marketplace'), ['marketplace', 'search']));
    }
    if (permissions.myProfile && permissions.myProfile.editProfile) {
      this.actions.push(new DashboardAction('edit_profile', this.i18n('Edit profile'), ['users', 'my-profile', 'edit']));
    }
  }

}
