import { ChangeDetectionStrategy, Component, Injector, OnInit, Input } from '@angular/core';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { QuickAccessDescriptor } from 'app/content/quick-access-descriptor';
import { QuickAccessType } from 'app/content/quick-access-type';
import { Breakpoint } from 'app/shared/layout.service';

export interface QuickAccessAction {
  icon: string;
  label: string;
  url: string[];
  breakpoints?: Breakpoint[];
}

/**
 * Displays the quick access, which are links to common actions
 */
@Component({
  selector: 'quick-access',
  templateUrl: 'quick-access.component.html',
  styleUrls: ['quick-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickAccessComponent extends BaseDashboardComponent implements OnInit {

  @Input() descriptors: QuickAccessDescriptor[] = [];

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
    const addAction = (descriptor: QuickAccessDescriptor | QuickAccessType,
      icon: string, label: string, url: string[]): void => {
      let desc: QuickAccessDescriptor;
      if (typeof descriptor === 'string') {
        desc = desc = this.descriptors.find(d => d.type === descriptor);
      } else {
        desc = descriptor;
      }
      if (desc) {
        this.actions.push({
          icon: icon,
          label: label,
          url: url
        });
      }
    };
    if (permissions.banking) {
      const accounts = (permissions.banking.accounts || []).filter(p => p.visible).map(p => p.account);
      const generalAccountDescriptor = this.descriptors.find(d => d.type === QuickAccessType.ACCOUNT && empty(d.accountType));
      for (const account of accounts) {
        const accountType = account.type;
        const ids = [accountType.id, accountType.internalName];
        const accountDescriptor = this.descriptors.find(d => d.type === QuickAccessType.ACCOUNT && ids.includes(d.accountType))
          || generalAccountDescriptor;
        if (accountDescriptor) {
          const accountLabel = accounts.length === 1 ? this.i18n('Account') : accountType.name;
          addAction(accountDescriptor, 'account', accountLabel, ['banking', 'account', ApiHelper.internalNameOrId(accountType)]);
        }
      }
      if (permissions.banking.payments.user) {
        addAction(QuickAccessType.PAY_USER, 'pay', this.i18n('Pay user'), ['banking', 'payment']);
      }
      if (permissions.banking.payments.system) {
        addAction(QuickAccessType.PAY_SYSTEM, 'pay', this.i18n('Pay system'), ['banking', 'payment', 'system']);
      }
    }
    if (permissions.contacts && (permissions.contacts.enable)) {
      addAction(QuickAccessType.CONTACTS, 'contact_list', this.i18n('Contacts'), ['users', 'contacts']);
    }
    if (permissions.users && (permissions.users.search || permissions.users.map)) {
      addAction(QuickAccessType.SEARCH_USERS, 'search_users', this.i18n('Directory'), ['users', 'search']);
    }
    if (permissions.marketplace && permissions.marketplace.search) {
      addAction(QuickAccessType.SEARCH_ADS, 'marketplace', this.i18n('Advertisements'), ['marketplace', 'search']);
    }
    if (permissions.myProfile && permissions.myProfile.editProfile) {
      addAction(QuickAccessType.EDIT_PROFILE, 'edit_profile', this.i18n('Edit profile'), ['users', 'my-profile', 'edit']);
    }
    if (permissions.passwords && !empty(permissions.passwords.passwords)) {
      addAction(QuickAccessType.PASSWORDS, 'passwords', this.i18n('Password'), ['users', 'passwords']);
    }
    // Must be asynchronous or sometimes will never hide the spinner
    setTimeout(() => this.notifyReady(), 1);
  }

}
