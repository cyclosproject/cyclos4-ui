import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { QuickAccessDescriptor } from 'app/content/quick-access-descriptor';
import { QuickAccessType } from 'app/content/quick-access-type';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { empty } from 'app/shared/helper';
import { Icon } from 'app/shared/icon';
import { Breakpoint } from 'app/shared/layout.service';
import { ActiveMenu, Menu, MenuEntry } from 'app/shared/menu';

export interface QuickAccessAction {
  icon: string;
  label: string;
  entry: MenuEntry;
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

  constructor(
    injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.actions = [];
    const dataForUi = this.dataForUiHolder.dataForUi;
    const auth = dataForUi.auth;
    const permissions = auth.permissions;
    const addAction = (descriptor: QuickAccessDescriptor | QuickAccessType,
      icon: Icon, label: string, activeMenu: ActiveMenu): void => {
      let desc: QuickAccessDescriptor;
      if (typeof descriptor === 'string') {
        desc = desc = this.descriptors.find(d => d.type === descriptor);
      } else {
        desc = descriptor;
      }
      if (desc) {
        const entry = this.menu.menuEntry(activeMenu);
        if (entry) {
          this.actions.push({
            icon: icon,
            label: label,
            entry: entry,
            breakpoints: desc.breakpoints
          });
        }
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
          const accountLabel = accounts.length === 1 ? this.messages.dashboard.action.account : accountType.name;
          addAction(accountDescriptor, 'quick_access_account', accountLabel, new ActiveMenu(Menu.ACCOUNT_HISTORY, accountType.id));
        }
      }
      if (permissions.banking.payments.user) {
        addAction(QuickAccessType.PAY_USER, 'quick_access_pay',
          this.messages.dashboard.action.payUser, new ActiveMenu(Menu.PAYMENT_TO_USER));
      }
      if (permissions.banking.payments.system) {
        addAction(QuickAccessType.PAY_SYSTEM, 'quick_access_pay',
          this.messages.dashboard.action.paySystem, new ActiveMenu(Menu.PAYMENT_TO_SYSTEM));
      }
    }
    if (permissions.contacts && (permissions.contacts.enable)) {
      addAction(QuickAccessType.CONTACTS, 'quick_access_contact_list',
        this.messages.dashboard.action.contacts, new ActiveMenu(Menu.CONTACTS));
    }
    if (permissions.users && (permissions.users.search || permissions.users.map)) {
      addAction(QuickAccessType.SEARCH_USERS, 'quick_access_search_users',
        this.messages.dashboard.action.directory, new ActiveMenu(Menu.SEARCH_USERS));
    }
    if (permissions.marketplace && permissions.marketplace.search) {
      addAction(QuickAccessType.SEARCH_ADS, 'quick_access_marketplace',
        this.messages.dashboard.action.advertisements, new ActiveMenu(Menu.SEARCH_ADS));
    }
    if (permissions.myProfile && permissions.myProfile.editProfile) {
      addAction(QuickAccessType.EDIT_PROFILE, 'quick_access_edit_profile',
        this.messages.dashboard.action.editProfile, new ActiveMenu(Menu.EDIT_MY_PROFILE));
    }
    if (permissions.passwords && !empty(permissions.passwords.passwords)) {
      const passwordsLabel = permissions.passwords.passwords.length === 1 ?
        this.messages.dashboard.action.password :
        this.messages.dashboard.action.passwords;
      addAction(QuickAccessType.PASSWORDS, 'quick_access_passwords', passwordsLabel, new ActiveMenu(Menu.PASSWORDS));
    }
  }

}
