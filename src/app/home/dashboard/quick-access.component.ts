import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { QuickAccessDescriptor } from 'app/content/quick-access-descriptor';
import { QuickAccessType } from 'app/content/quick-access-type';
import { BaseDashboardComponent } from 'app/home/dashboard/base-dashboard.component';
import { empty, handleKeyboardFocus, blurIfClick } from 'app/shared/helper';
import { Icon } from 'app/shared/icon';
import { Breakpoint } from 'app/shared/layout.service';
import { ActiveMenu, Menu, MenuEntry } from 'app/shared/menu';
import { Arrows } from 'app/shared/shortcut.service';

export interface QuickAccessAction {
  icon: string;
  label: string;
  entry: MenuEntry;
  breakpoints?: Breakpoint[];
  onClick?: () => void;
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

  /** Export to template */
  blurIfClick = blurIfClick;

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
      icon: Icon, label: string, activeMenu: ActiveMenu, onClick?: () => void): void => {
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
            breakpoints: desc.breakpoints,
            onClick: onClick
          });
        }
      }
    };
    if (permissions.banking) {
      const accounts = (permissions.banking.accounts || []).filter(p => p.visible).map(p => p.account);
      const generalAccountDescriptor = this.descriptors.find(d => d.type === QuickAccessType.Account && empty(d.accountType));
      for (const account of accounts) {
        const accountType = account.type;
        const ids = [accountType.id, accountType.internalName];
        const accountDescriptor = this.descriptors.find(d => d.type === QuickAccessType.Account && ids.includes(d.accountType))
          || generalAccountDescriptor;
        if (accountDescriptor) {
          const accountLabel = accounts.length === 1 ? this.i18n.dashboard.action.account : accountType.name;
          addAction(accountDescriptor, 'quick_access_account', accountLabel, new ActiveMenu(Menu.ACCOUNT_HISTORY, {
            accountType: accountType
          }));
        }
      }
      if (permissions.banking.payments.user) {
        addAction(QuickAccessType.PayUser, 'quick_access_pay',
          this.i18n.dashboard.action.payUser, new ActiveMenu(Menu.PAYMENT_TO_USER));
      }
      if (permissions.banking.payments.system) {
        addAction(QuickAccessType.PaySystem, 'quick_access_pay',
          this.i18n.dashboard.action.paySystem, new ActiveMenu(Menu.PAYMENT_TO_SYSTEM));
      }
      if (permissions.banking.payments.pos) {
        addAction(QuickAccessType.Pos, 'quick_access_pos',
          this.i18n.dashboard.action.pos, new ActiveMenu(Menu.POS));
      }
    }
    if (permissions.contacts && (permissions.contacts.enable)) {
      addAction(QuickAccessType.Contacts, 'quick_access_contact_list',
        this.i18n.dashboard.action.contacts, new ActiveMenu(Menu.CONTACTS));
    }
    if (permissions.users && (permissions.users.search || permissions.users.map)) {
      addAction(QuickAccessType.SearchUsers, 'quick_access_search_users',
        this.i18n.dashboard.action.directory, new ActiveMenu(Menu.SEARCH_USERS));
    }
    if (permissions.marketplace && permissions.marketplace.search) {
      addAction(QuickAccessType.SearchAds, 'quick_access_marketplace',
        this.i18n.dashboard.action.advertisements, new ActiveMenu(Menu.SEARCH_ADS));
    }
    if (permissions.myProfile && permissions.myProfile.editProfile) {
      addAction(QuickAccessType.EditProfile, 'quick_access_edit_profile',
        this.i18n.dashboard.action.editProfile, new ActiveMenu(Menu.EDIT_MY_PROFILE));
    }
    if (permissions.passwords && !empty(permissions.passwords.passwords)) {
      const passwordsLabel = permissions.passwords.passwords.length === 1 ?
        this.i18n.dashboard.action.password :
        this.i18n.dashboard.action.passwords;
      addAction(QuickAccessType.Passwords, 'quick_access_passwords', passwordsLabel, new ActiveMenu(Menu.PASSWORDS));
    }
    addAction(QuickAccessType.SwitchTheme, 'quick_access_theme', this.i18n.dashboard.action.switchTheme, new ActiveMenu(Menu.SETTINGS),
      () => {
        this.layout.darkTheme = !this.layout.darkTheme;
      });

    // Handle keyboard shortcuts: arrows to navigate correctly on the grid
    this.addShortcut(Arrows, event => {
      handleKeyboardFocus(this.layout, this.element, event, {
        horizontalOffset: 1, verticalOffset: 2
      });
    });

    // Also add a shortcut on each action by number
    for (let i = 0; i < 9 && i < this.actions.length; i++) {
      const action = this.actions[i];
      this.addShortcut(String(i + 1), e => {
        if (this.layout.gtxs) {
          // Ignore if not on mobile
          return false;
        }
        this.navigate(action, e);
      });
    }
  }

  navigate(action: QuickAccessAction, event?: Event) {
    if (action.onClick) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      action.onClick();
    } else {
      this.menu.navigate({
        entry: action.entry,
        clear: false,
        event: event
      });
    }
  }

  shortcutKey(action: QuickAccessAction): string {
    if (this.layout.xxs) {
      const index = this.actions.indexOf(action);
      if (index >= 0 && index < 9) {
        return String(index + 1);
      }
    }
  }

}
