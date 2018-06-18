import { Injectable } from '@angular/core';
import { MenuType, Menu, RootMenuEntry, MenuEntry, RootMenu, FloatingMenu, SideMenuEntries } from 'app/shared/menu';
import { Messages } from 'app/messages/messages';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs';
import { AccountStatus, Auth } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable()
export class MenuService {

  constructor(
    private pushNotifications: PushNotificationsService,
    private accountsService: AccountsService,
    private messages: Messages,
    private dataForUiHolder: DataForUiHolder
  ) {
    // Clear the status whenever the logged user changes
    this._fullMenu = new BehaviorSubject<RootMenuEntry[]>([]);
    const initialDataForUi = this.dataForUiHolder.dataForUi;
    const initialAuth = (initialDataForUi || {}).auth;

    if (initialDataForUi != null) {
      this._fullMenu.next(this.buildFullMenu(initialAuth));
      if (initialAuth != null) {
        // Fetch the data initially - there is a logged user
        this.fetchData();
      }
    }
    // Whenever the authenticated user changes, reload the menu
    dataForUiHolder.subscribe(dataForUi => {
      const auth = (dataForUi || {}).auth;
      this._fullMenu.next(this.buildFullMenu(auth));
      if (auth == null) {
        // Logged out: clear the data
        this.clearData();
      } else {
        // Logged in: fetch the data
        this.fetchData();
      }
    });
    this.pushNotifications.subscribeForAccountStatus(account => {
      const statuses = this._accountStatuses.value;
      statuses.set(account.id, account.status);
      this._accountStatuses.next(statuses);
    });
  }

  private _fullMenu: BehaviorSubject<RootMenuEntry[]>;
  private _accountStatuses = new BehaviorSubject<Map<String, AccountStatus>>(new Map());

  get accountStatuses(): BehaviorSubject<Map<String, AccountStatus>> {
    if (this._accountStatuses == null) {
      this.fetchData();
    }
    return this._accountStatuses;
  }

  /**
   * Returns the available `MenuEntry` for the given `Menu`, if any, or null if none matches
   * @param menu The menu indication
   */
  menuEntry(menu: Menu): MenuEntry {
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      if (rootEntry.rootMenu === menu.root) {
        for (const entry of rootEntry.entries) {
          if (entry.menu === menu) {
            return entry;
          }
        }
      }
    }
    return null;
  }


  /**
   * Returns the available `RootMenuEntry` for the given `RootMenu`, if any, or null if none matches
   * @param root The root menu
   */
  rootEntry(root: RootMenu): RootMenuEntry {
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      if (rootEntry.rootMenu === root) {
        return rootEntry;
      }
    }
    return null;
  }

  /**
   * Returns the menu structure to be displayed in a specific menu.
   */
  menu(type: MenuType): Observable<RootMenuEntry[]> {
    return this._fullMenu.pipe(
      map(fullRoots => {
        const roots: RootMenuEntry[] = [];
        for (const root of fullRoots) {
          if (root.showIn != null && !root.showIn.includes(type)) {
            // This entire root entry is not available for this menu type
            continue;
          }
          // Make a copy, because we don't know if there are filtered entries
          const copy = new RootMenuEntry(root.rootMenu, root.icon, root.label, root.title, root.showIn);
          for (const entry of root.entries) {
            if (entry.showIn != null && !entry.showIn.includes(type)) {
              // This entry is not available for this menu type
              continue;
            }
            copy.entries.push(entry);
          }
          // Use the copy
          roots.push(copy);
        }
        return roots;
      })
    );
  }

  /**
   * Returns the menu entries to show in the side menu, plus the menu title.
   * Takes into account the given menu's FloatingMenu, as it must match the floating menu of the returned entries.
   */
  sideMenu(menu: Menu): Observable<SideMenuEntries> {
    return this.menu(MenuType.SIDE).pipe(
      map(roots => {
        const root = roots.find(e => e.rootMenu === menu.root);
        if (root == null) {
          return new SideMenuEntries(null, []);
        }
        let title = root.title;
        if (menu.floating) {
          title = this.floatingTitle(menu.floating);
        }
        const entries = root.entries.filter(e => e.menu.floating === menu.floating);
        return new SideMenuEntries(title, entries);
      })
    );
  }

  /**
   * Returns the title for the given floating menu
   * @param floating The floating menu
   */
  private floatingTitle(floating: FloatingMenu): string {
    switch (floating) {
      case FloatingMenu.EDIT_MY_PROFILE:
        return this.messages.floatingMenuEditMyProfileTitle();
    }
    return null;
  }

  private fetchData() {
    // Get the balance for each account
    this.accountsService.listAccountsByOwner({
      owner: ApiHelper.SELF,
      fields: ['id', 'status.balance']
    })
      .subscribe(accounts => {
        const accountStatuses = new Map<String, AccountStatus>();
        for (const account of accounts) {
          accountStatuses.set(account.id, account.status);
        }
        this.accountStatuses.next(accountStatuses);
      });
  }

  private clearData() {
    this.accountStatuses.next(null);
  }

  /**
   * Build the full menu structure from the given authentication
   */
  private buildFullMenu(maybeNullAuth: Auth): RootMenuEntry[] {
    const auth = maybeNullAuth || {};
    const permissions = auth.permissions;
    const user = auth.user;

    const roots = new Map<RootMenu, RootMenuEntry>();
    // Lambda that adds a root menu
    const addRoot = (root: RootMenu, icon: string, label: string, title: string = null, showIn: MenuType[] = null) => {
      const entry = new RootMenuEntry(root, icon, label, title, showIn);
      roots.set(root, entry);
      return entry;
    };
    // Create the root menu entries
    addRoot(RootMenu.HOME,
      user == null ? 'home' : 'dashboard',
      user == null ? this.messages.menuHome() : this.messages.menuDashboard());
    addRoot(RootMenu.LOGIN, 'lock', this.messages.menuLogin());
    addRoot(RootMenu.REGISTRATION, 'input', this.messages.menuRegister());
    addRoot(RootMenu.BANKING, 'account_balance', this.messages.menuBanking(), this.messages.menuBankingTitle());
    addRoot(RootMenu.USERS, 'group', this.messages.menuUsers(), this.messages.menuUsersTitle());
    addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.messages.menuMarketplace(), this.messages.menuMarketplaceTitle());
    addRoot(RootMenu.PERSONAL, 'account_box', this.messages.menuPersonal(), this.messages.menuPersonalTitle());

    // Lambda that adds a submenu to a root menu
    const add = (menu: Menu, url: string, icon: string, label: string, showIn: MenuType[] = null) => {
      const root = roots.get(menu.root);
      root.entries.push(new MenuEntry(menu, url, icon, label, showIn));
    };
    // Add the submenus
    add(Menu.HOME, '/',
      user == null ? 'home' : 'dashboard',
      user == null ? this.messages.menuHome() : this.messages.menuDashboard());
    if (user == null) {
      // Guest
      const registrationGroups = (this.dataForUiHolder.dataForUi || {}).publicRegistrationGroups || [];
      add(Menu.LOGIN, '/login', 'lock', this.messages.menuLogin());
      if (registrationGroups.length > 0) {
        add(Menu.REGISTRATION, '/users/registration', 'input', this.messages.menuRegister());
      }
    } else {
      const banking = permissions.banking || {};
      const users = permissions.users || {};
      const accounts = banking.accounts || [];

      // Banking
      if (accounts.length > 0) {
        for (const account of accounts) {
          const type = account.account.type;
          add(Menu.ACCOUNT_HISTORY, '/banking/account/' + ApiHelper.internalNameOrId(type),
            'account_balance', type.name, [MenuType.BAR, MenuType.SIDENAV]);
        }
      }
      const payments = banking.payments || {};
      if (payments.user || payments.system || payments.self) {
        add(Menu.PERFORM_PAYMENT, '/banking/payment', 'payment',
          this.messages.menuBankingPayment());
      }
      if ((banking.scheduledPayments || {}).view) {
        add(Menu.SCHEDULED_PAYMENTS, '/banking/scheduled-payments', 'schedule',
          this.messages.menuBankingScheduledPayments());
      }
      if ((banking.recurringPayments || {}).view) {
        add(Menu.RECURRING_PAYMENTS, '/banking/recurring-payments', 'loop',
          this.messages.menuBankingRecurringPayments());
      }

      // Users
      add(Menu.SEARCH_USERS, '/users/search', 'group',
        this.messages.menuUsersSearch());

      // Marketplace (not implemented yet)
      /*
      add(Menu.SEARCH_MARKETPLACE, '/marketplace/search', 'shopping_cart',
        this.messages.menuMarketplaceSearch());
      */

      const myProfile = permissions.myProfile;
      // Personal
      add(Menu.MY_PROFILE, '/users/my-profile', 'account_box',
        this.messages.menuPersonalProfile(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      if (myProfile.editProfile) {
        add(Menu.EDIT_MY_PROFILE, '/users/my-profile/edit', 'account_box',
          this.messages.menuPersonalEditMyProfile());
      }
      if (myProfile.managePhones) {
        add(Menu.MY_PHONES, '/users/my-profile/phones', 'phone',
          this.messages.menuPersonalPhones(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if (myProfile.manageAddresses) {
        add(Menu.MY_ADDRESSES, '/users/my-profile/addresses', 'place',
          this.messages.menuPersonalAddresses(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if (myProfile.manageImages) {
        add(Menu.MY_IMAGES, '/users/my-profile/images', 'photo_library',
          this.messages.menuPersonalImages(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if (myProfile.manageContactInfos) {
        add(Menu.MY_CONTACT_INFOS, '/users/my-profile/contact-infos', 'perm_contact_calendar',
          this.messages.menuPersonalContactInfos(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      add(Menu.SETTINGS, '/settings', 'settings',
        this.messages.menuPersonalSettings(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      if (users.contacts) {
        add(Menu.CONTACTS, '/personal/contacts', 'contacts',
          this.messages.menuPersonalContacts(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if ((permissions.passwords || {}).manage) {
        add(Menu.PASSWORDS, '/personal/passwords', 'lock',
          this.messages.menuPersonalPasswords(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      add(Menu.LOGOUT, null, 'exit_to_app',
        this.messages.menuPersonalLogout());
    }

    // Populate the menu in the root declaration order
    const rootMenus: RootMenuEntry[] = [];
    for (const root of RootMenu.values()) {
      const rootEntry = roots.get(root);
      if (rootEntry && rootEntry.entries.length > 0) {
        rootMenus.push(rootEntry);
      }
    }
    return rootMenus;
  }
}
