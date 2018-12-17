import { Injectable } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Auth } from 'app/api/models';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { ApiHelper } from 'app/shared/api-helper';
import { LayoutService } from 'app/shared/layout.service';
import { Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry, SideMenuEntries, ConditionalMenu } from 'app/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { LoginService } from 'app/core/login.service';

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {

  /** The active menu, according to the visible page */
  activeMenu$: Observable<Menu>;

  /** The active root menu, according to the visible page */
  activeRootMenu$: Observable<RootMenu>;

  /**
   * The last menu item which was selected by the user.
   * If the user navigates through links will not correspond to the active menu.
   */
  lastSelectedMenu$: Observable<Menu>;

  /** The last menu which was selected by the user */
  private _lastSelectedMenu = new BehaviorSubject<Menu | ConditionalMenu>(null);
  get lastSelectedMenu(): Menu {
    return this.resolveMenu(this._lastSelectedMenu.value);
  }
  set lastSelectedMenu(menu: Menu) {
    this._lastSelectedMenu.next(menu);

    // Whenever the last selected menu changes, update the classes in the body element
    const classes = document.body.classList;
    RootMenu.values().forEach(root => {
      const current = `root-menu--${root}`;
      if (menu && menu.root === root) {
        if (!classes.contains(current)) {
          classes.add(current);
        }
      } else {
        if (classes.contains(current)) {
          classes.remove(current);
        }
      }
    });
  }

  private _activeMenu = new BehaviorSubject<Menu>(null);
  private _fullMenu = new BehaviorSubject<RootMenuEntry[]>([]);

  constructor(
    private i18n: I18n,
    private dataForUiHolder: DataForUiHolder,
    private login: LoginService,
    layout: LayoutService
  ) {
    const initialDataForUi = this.dataForUiHolder.dataForUi;
    const initialAuth = (initialDataForUi || {}).auth;

    if (initialDataForUi != null) {
      this._fullMenu.next(this.buildFullMenu(initialAuth));
    }
    // Whenever the authenticated user changes, reload the menu
    dataForUiHolder.subscribe(dataForUi => {
      const auth = (dataForUi || {}).auth;
      this._fullMenu.next(this.buildFullMenu(auth));
      this.lastSelectedMenu = null;
    });
    this.activeMenu$ = this._activeMenu.asObservable().pipe(
      distinctUntilChanged()
    );
    this.activeRootMenu$ = this.activeMenu$.pipe(
      map(menu => menu == null ? null : menu.root),
      filter(rootMenu => rootMenu != null),
      distinctUntilChanged()
    );
    this.lastSelectedMenu$ = this._lastSelectedMenu.asObservable().pipe(
      map(v => this.resolveMenu(v)),
      distinctUntilChanged()
    );
    layout.currentPage$.subscribe(p => {
      if (p && this.shouldUpdateLastMenu) {
        this._lastSelectedMenu.next(p.menuItem);
      }
    });
  }

  private get shouldUpdateLastMenu(): boolean {
    const last = this.lastSelectedMenu;
    return last == null || last === Menu.HOME || last === Menu.DASHBOARD;
  }

  /** Indicates the next menu item */
  nextMenu(menu: Menu) {
    this._activeMenu.next(menu);
    if (this.lastSelectedMenu == null) {
      this.lastSelectedMenu = menu;
    }
  }

  get activeMenu(): Menu {
    return this._activeMenu.value;
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
   * @param root The root menu. If not specified, will use the active root menu.
   */
  rootEntry(root?: RootMenu): RootMenuEntry {
    if (root == null) {
      const menu = this._activeMenu.value;
      if (menu) {
        root = menu.root;
      }
    }
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
   */
  sideMenu(menu: Menu): Observable<SideMenuEntries> {
    return this.menu(MenuType.SIDE).pipe(
      map(roots => {
        const root = menu == null ? null : roots.find(e => e.rootMenu === menu.root);
        if (root == null) {
          return new SideMenuEntries(null, []);
        }
        return new SideMenuEntries(root.title, root.entries);
      })
    );
  }

  /**
   * Build the full menu structure from the given authentication
   */
  private buildFullMenu(maybeNullAuth: Auth): RootMenuEntry[] {
    const auth = maybeNullAuth || {};
    const permissions = auth.permissions;
    const user = auth.user;
    const restrictedAccess = auth.expiredPassword || auth.pendingAgreements;
    const users = permissions.users || {};
    const marketplace = permissions.marketplace || {};

    const roots = new Map<RootMenu, RootMenuEntry>();
    // Lambda that adds a root menu
    const addRoot = (root: RootMenu, icon: string, label: string, title: string = null, showIn: MenuType[] = null) => {
      const entry = new RootMenuEntry(root, icon, label, title, showIn);
      roots.set(root, entry);
      return entry;
    };
    // Create the root menu entries
    const home = addRoot(RootMenu.HOME, 'home', this.i18n({ value: 'Home', description: 'Menu' }), null);
    const dashboard = addRoot(RootMenu.DASHBOARD, 'dashboard',
      this.i18n({ value: 'Dashboard', description: 'Menu' }), null);
    const publicDirectory = addRoot(RootMenu.PUBLIC_DIRECTORY, 'group', this.i18n({ value: 'Directory', description: 'Menu' }));
    const publicMarketplace = addRoot(RootMenu.PUBLIC_MARKETPLACE,
      'shopping_cart', this.i18n({ value: 'Advertisements', description: 'Menu' }));
    addRoot(RootMenu.BANKING, 'account_balance', this.i18n({ value: 'Banking', description: 'Menu' }));
    const marketplaceRoot = addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.i18n({ value: 'Marketplace', description: 'Menu' }));
    addRoot(RootMenu.PERSONAL, 'account_box', this.i18n({ value: 'Personal', description: 'Menu' }));
    const register = addRoot(RootMenu.REGISTRATION, 'registration', this.i18n({ value: 'Register', description: 'Menu' }));
    const login = addRoot(RootMenu.LOGIN, 'exit_to_app', this.i18n({ value: 'Login', description: 'Menu' }));

    // Lambda that adds a submenu to a root menu
    const add = (menu: Menu, url: string, icon: string, label: string, showIn: MenuType[] = null) => {
      const root = roots.get(menu.root);
      root.entries.push(new MenuEntry(menu, url, icon, label, showIn));
    };
    // Add the submenus
    if (restrictedAccess) {
      // Only show the logout
      add(Menu.LOGOUT, null, 'logout',
        this.i18n({ value: 'Logout', description: 'Menu' }),
        [MenuType.PERSONAL, MenuType.SIDENAV]);
    } else if (user == null) {
      // Guest
      add(Menu.HOME, '/', home.icon, home.label);
      if (users.search || users.map) {
        add(Menu.PUBLIC_DIRECTORY, '/users/public-search', publicDirectory.icon, publicDirectory.label);
      }
      if (marketplace.search) {
        add(Menu.PUBLIC_MARKETPLACE, '/marketplace/public-search', publicMarketplace.icon, publicMarketplace.label);
      }
      const registrationGroups = (this.dataForUiHolder.dataForUi || {}).publicRegistrationGroups || [];
      if (registrationGroups.length > 0) {
        add(Menu.REGISTRATION, '/users/registration', register.icon, register.label);
      }
      add(Menu.LOGIN, '/login', login.icon, login.label);
    } else {
      // Logged user
      add(Menu.DASHBOARD, '/', dashboard.icon, dashboard.label);

      const banking = permissions.banking || {};
      const contacts = permissions.contacts || {};
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
      if (payments.user) {
        add(Menu.PAYMENT_TO_USER, '/banking/payment', 'payment',
          this.i18n({ value: 'Payment to user', description: 'Menu' }));
      }
      if (payments.self) {
        add(Menu.PAYMENT_TO_SELF, '/banking/payment/self', 'payment',
          this.i18n({ value: 'Payment to self', description: 'Menu' }));
      }
      if (payments.system) {
        add(Menu.PAYMENT_TO_SYSTEM, '/banking/payment/system', 'payment',
          this.i18n({ value: 'Payment to system', description: 'Menu' }));
      }
      const scheduledPayments = (banking.scheduledPayments || {});
      const recurringPayments = (banking.recurringPayments || {});
      if (scheduledPayments.view || recurringPayments.view) {
        add(Menu.SCHEDULED_PAYMENTS, '/banking/scheduled-payments', 'schedule',
          this.i18n({ value: 'Scheduled payments', description: 'Menu' }));
      }
      if ((banking.authorizations || {}).view) {
        add(Menu.AUTHORIZED_PAYMENTS, '/banking/authorized-payments', 'assignment_turned_in',
          this.i18n({ value: 'Payment authorizations', description: 'Menu' }));
      }

      // Marketplace
      if (users.search || users.map) {
        add(Menu.SEARCH_USERS, '/users/search', 'group',
          this.i18n({ value: 'Business directory', description: 'Menu' }));
      }
      if (marketplace.search) {
        add(Menu.SEARCH_ADS, '/marketplace/search', 'shopping_cart',
          this.i18n({ value: 'Advertisements', description: 'Menu' }));
      } else {
        // As the search ads won't be visible, show as user directory instead
        marketplaceRoot.icon = publicDirectory.icon;
        marketplaceRoot.label = publicDirectory.label;
      }

      // Personal
      const myProfile = permissions.myProfile || {};
      add(Menu.MY_PROFILE, '/users/my-profile', 'account_box',
        this.i18n({ value: 'My profile', description: 'Menu' }),
        [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      if (myProfile.editProfile) {
        add(Menu.EDIT_MY_PROFILE, '/users/my-profile/edit', 'account_box',
          this.i18n({ value: 'Edit profile', description: 'Menu' }),
          [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if (contacts.enable) {
        add(Menu.CONTACTS, '/users/contacts', 'import_contacts',
          this.i18n({ value: 'Contacts', description: 'Menu' }),
          [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if ((permissions.passwords || {}).manage) {
        add(Menu.PASSWORDS, '/users/passwords', 'vpn_key',
          this.i18n({ value: 'Passwords', description: 'Menu' }),
          [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      add(Menu.LOGOUT, null, 'logout',
        this.i18n({ value: 'Logout', description: 'Menu' }),
        [MenuType.PERSONAL, MenuType.SIDENAV]);
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

  private resolveMenu(value: Menu | ConditionalMenu): Menu {
    if (value instanceof ConditionalMenu) {
      return this.login.user ? value.loggedUsers : value.guests;
    }
    return this._lastSelectedMenu.value as Menu;

  }
}
