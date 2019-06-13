import { Injectable, Injector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AccountType, Auth, DataForUi, Operation, RoleEnum } from 'app/api/models';
import { Configuration } from 'app/configuration';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LoginService } from 'app/core/login.service';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { StateManager } from 'app/core/state-manager';
import { I18n } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { toFullUrl } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { ActiveMenu, ConditionalMenu, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry, SideMenuEntries } from 'app/shared/menu';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { I18nLoadingService } from 'app/core/i18n-loading.service';

/**
 * Parameters accepted by the `navigate` method
 */
export interface NavigateParams {
  /** The URL to navigate to */
  url?: string;

  /** The active menu to use */
  menu?: ActiveMenu;

  /** The menu entry to navigate to */
  entry?: MenuEntry;

  /** Whether the clear the current navigation (default) or not */
  clear?: boolean;

  /** An UI event to cancel */
  event?: Event;
}

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {

  get activeMenu(): ActiveMenu {
    return this._activeMenu.value;
  }
  get fullMenu(): RootMenuEntry[] {
    return this._fullMenu.value;
  }

  constructor(
    private i18n: I18n,
    private injector: Injector,
    private dataForUiHolder: DataForUiHolder,
    i18nLoading: I18nLoadingService,
    private router: Router,
    private login: LoginService,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager,
    private bankingHelper: BankingHelperService,
    private content: ContentService,
    private operationHelper: OperationHelperService,
    layout: LayoutService
  ) {
    const initialDataForUi = this.dataForUiHolder.dataForUi;
    const initialAuth = (initialDataForUi || {}).auth;

    // If initially with a DataForUi instance and using static locale
    if (initialDataForUi != null && i18nLoading.isStatic) {
      this._fullMenu.next(this.buildFullMenu(initialAuth));
    }

    // Whenever the authenticated user changes, reload the menu
    const buildMenu = (dataForUi: DataForUi) => {
      if (this.i18n.initialized$.value) {
        const auth = (dataForUi || {}).auth;
        this._fullMenu.next(this.buildFullMenu(auth));
        this._activeMenu.next(null);
      }
    };
    dataForUiHolder.subscribe(buildMenu);
    i18nLoading.subscribeForLocale(() => buildMenu(dataForUiHolder.dataForUi));

    // Whenever we navigate back to home, update the active menu to match
    router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => e as NavigationEnd),
      filter(e => e.url === '/' || e.url === '/home')
    ).subscribe(e => {
      const entry = this.menuEntry(e.url);
      if (entry) {
        this.updateActiveMenu(entry.activeMenu);
      }
    });

    this._activeMenu.subscribe(active => {
      // Update the body classes
      this.updateBodyClasses(active ? active.menu : null);
    });
    this.activeMenu$ = this._activeMenu.asObservable();
    layout.currentPage$.subscribe(p => {
      if (p && this.activeMenu == null) {
        this.setActiveMenu(p.menuItem);
      }
    });
  }

  /**
   * The current active menu descriptor
   */
  activeMenu$: Observable<ActiveMenu>;
  private _activeMenu = new BehaviorSubject<ActiveMenu>(null);
  private _fullMenu = new BehaviorSubject<RootMenuEntry[]>(null);

  /**
   * Navigates to a menu entry
   */
  navigate(params: NavigateParams) {
    let url: string;
    if (params.url) {
      // An URL was given. Attempt to find a matching entry
      url = toFullUrl(params.url);
      if (!params.entry) {
        params.entry = this.entryByUrl(url);
        if (params.entry) {
          // Use the entry URL, as it is more "correct"
          url = params.entry.url;
          params.menu = params.entry.activeMenu;
        }
      }
    } else if (params.menu) {
      // A Menu instance was given. Attempt to find an entry for it
      params.entry = this.menuEntry(params.menu);
      if (params.entry) {
        // Use the entry URL, as it is more "correct"
        url = params.entry.url;
      } else {
        throw new Error(`Cannot navigate to ${params.menu}`);
      }
    } else if (params.entry) {
      // An already resolved menu entry
      url = params.entry.url;
      params.menu = params.entry.activeMenu;
    }

    if (params.event) {
      params.event.stopPropagation();
      params.event.preventDefault();
      const target = params.event.target as HTMLElement;
      target.blur();
    }

    // Clear the shared state
    if (params.clear !== false) {
      this.breadcrumb.clear();
      this.stateManager.clear();
    }

    // Either perform the logout or navigate
    if (params.entry && params.entry.menu === Menu.LOGOUT) {
      this.login.logout();
    } else if (url && url.startsWith('http')) {
      // An absolute URL
      const absoluteRoot = toFullUrl('/');
      if (url.startsWith(absoluteRoot)) {
        // Is an internal link
        url = url.substring(absoluteRoot.length);
        this.router.navigateByUrl(url);
      } else {
        // Is an external link - all we can do is assign the location
        location.assign(url);
      }
    } else if (url) {
      this.router.navigateByUrl(url);
    }

    // Update the active state
    if (params.menu) {
      this.updateActiveMenu(params.menu);
    }
  }

  /**
   * Finds a menu entry that points to a given URL
   * @param url The URL
   */
  entryByUrl(url: string): MenuEntry {
    url = toFullUrl(url);
    for (const root of this.fullMenu || []) {
      for (const entry of root.entries || []) {
        const entryUrl = toFullUrl(entry.url);
        if (entryUrl && entryUrl === url) {
          return entry;
        }
      }
    }
    return null;
  }

  /**
   * Sets the active menu
   */
  setActiveMenu(menu: ActiveMenu | Menu | ConditionalMenu): void {
    // Whenever the last selected menu changes, update the classes in the body element
    if (menu instanceof ActiveMenu) {
      this.updateActiveMenu(menu);
    } else {
      const observable = this.resolveMenu(menu);
      if (observable) {
        observable.pipe(first()).subscribe(m => this.updateActiveMenu(m));
      }
    }
  }

  /**
   * Sets the menu to the account history of the given account type
   */
  setActiveAccountType(accountType: AccountType): void {
    this.updateActiveMenu(new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: accountType }));
  }

  /**
   * Sets the menu to run the given custom operation as owner, ie, not inside an advertisement or user
   */
  setActiveOwnerOperation(operation: Operation): void {
    const menu = ApiHelper.menuForOwnerOperation(operation);
    if (menu != null) {
      this.updateActiveMenu(new ActiveMenu(menu, { operation: operation }));
    }
  }

  /**
   * Sets the menu to run the given custom operation as an action, that is, standalone
   */
  setActiveActionOperation(operation: Operation): void {
    this.updateActiveMenu(new ActiveMenu(Menu.RUN_ACTION_OPERATION, { operation: operation }));
  }

  /**
   * Sets the menu to the content page with the given slug
   */
  setActiveContentPageSlug(slug: string): void {
    const entry = this.contentPageEntry(slug);
    if (entry) {
      this.updateActiveMenu(entry.activeMenu);
    }
  }

  private updateActiveMenu(activeMenu: ActiveMenu) {
    if (activeMenu.menu === Menu.LOGOUT) {
      activeMenu = new ActiveMenu(Menu.HOME);
    }
    this._activeMenu.next(activeMenu);
  }

  private updateBodyClasses(menu: Menu) {
    const classes = document.body.classList;
    RootMenu.values().forEach(root => {
      const current = `${root}-menu`;
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

  /**
   * Returns the available `MenuEntry` for the given `Menu`, if any, or null if none matches
   * @param menu The menu indication
   */
  menuEntry(activeMenu: Menu | ActiveMenu | string): MenuEntry {
    if (typeof (activeMenu) === 'string') {
      // The activeMenu is actually the URL
      const roots = this._fullMenu.value || [];
      for (const rootEntry of roots) {
        for (const entry of rootEntry.entries || []) {
          if (entry.url === activeMenu) {
            return entry;
          }
        }
      }
    } else {
      // Either a Menu or ActiveMenu. Make sure it is an ActiveMenu
      if (activeMenu instanceof Menu) {
        activeMenu = new ActiveMenu(activeMenu);
      }
      if (activeMenu) {
        const roots = this._fullMenu.value || [];
        for (const rootEntry of roots) {
          for (const entry of rootEntry.entries || []) {
            if (activeMenu.matches(entry)) {
              return entry;
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Returns the available `MenuEntry` for the account type with the given id
   * @param typeId The account type identifier
   */
  accountEntry(type: AccountType): MenuEntry {
    if (type == null) {
      return null;
    }
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      for (const entry of rootEntry.entries || []) {
        const data = entry.activeMenu.data;
        if (data && data.accountType && (data.accountType.id === type.id)) {
          return entry;
        }
      }
    }
    return null;
  }

  /**
   * Returns the available `MenuEntry` for the content page with the given slug
   * @param slug The content page slug
   */
  contentPageEntry(slug: string): MenuEntry {
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      for (const entry of rootEntry.entries || []) {
        const data = entry.activeMenu.data;
        if (data && data.contentPage === slug) {
          return entry;
        }
      }
    }
    return null;
  }


  /**
   * Returns the available `MenuEntry` for the custom operation with the given id or internal name
   * @param op The operation id or internal name
   */
  operationEntry(op: string): MenuEntry {
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      for (const entry of rootEntry.entries || []) {
        const data = entry.activeMenu.data;
        if (data && data.operation === op) {
          return entry;
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
        root = menu.menu.root;
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
        for (const root of fullRoots || []) {
          if (root.showIn != null && !root.showIn.includes(type)) {
            // This entire root entry is not available for this menu type
            continue;
          }
          // Make a copy, because we don't know if there are filtered entries
          const copy = new RootMenuEntry(root.rootMenu, root.icon, root.label, root.title, root.showIn, root.dropdown);
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
    const contentPages = this.content.contentPages;

    const auth = maybeNullAuth || {};
    const role = auth == null ? null : auth.role;
    const permissions = auth.permissions || {};
    const user = auth.user;
    const restrictedAccess = auth.expiredPassword || auth.pendingAgreements;
    const users = permissions.users || {};
    const marketplace = permissions.marketplace || {};
    const operations = permissions.operations || {};
    const userOperations = (operations.user || []).filter(o => o.run).map(o => o.operation);
    const systemOperations = (operations.system || []).filter(o => o.run).map(o => o.operation);

    const roots = new Map<RootMenu, RootMenuEntry>();
    // Lambda that adds a root menu
    const addRoot = (root: RootMenu, icon: string, label: string, title: string = null, showIn: MenuType[] = null) => {
      const entry = new RootMenuEntry(root, icon, label, title, showIn);
      roots.set(root, entry);
      return entry;
    };
    // Create the root menu entries
    const home = addRoot(RootMenu.HOME, 'home', this.i18n.menu.home, null);
    const dashboard = addRoot(RootMenu.DASHBOARD, 'dashboard', this.i18n.menu.dashboard, null);
    const publicDirectory = addRoot(RootMenu.PUBLIC_DIRECTORY, 'group', this.i18n.menu.marketplaceDirectory);
    const publicMarketplace = addRoot(RootMenu.PUBLIC_MARKETPLACE, 'shopping_cart', this.i18n.menu.marketplaceAdvertisements);
    addRoot(RootMenu.BANKING, 'account_balance', this.i18n.menu.banking);
    addRoot(RootMenu.OPERATORS, 'supervised_user_circle', this.i18n.menu.operators);
    addRoot(RootMenu.BROKERING, 'assignment_ind', this.i18n.menu.brokering);
    const marketplaceRoot = addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.i18n.menu.marketplace);
    if (role === RoleEnum.ADMINISTRATOR) {
      // For admins, show the marketplace menu as users
      marketplaceRoot.icon = 'supervised_user_circle';
      marketplaceRoot.label = this.i18n.menu.marketplaceUsers;
      marketplaceRoot.title = this.i18n.menu.marketplaceUsers;
    }
    const content = addRoot(RootMenu.CONTENT, 'information', this.i18n.menu.content);
    addRoot(RootMenu.PERSONAL, 'account_box', this.i18n.menu.personal, null, [MenuType.SIDENAV, MenuType.BAR, MenuType.SIDE]);
    const register = addRoot(RootMenu.REGISTRATION, 'registration', this.i18n.menu.register, null, [MenuType.SIDENAV]);
    const login = addRoot(RootMenu.LOGIN, 'exit_to_app', this.i18n.menu.login, null, [MenuType.SIDENAV]);
    const logout = addRoot(RootMenu.LOGOUT, 'logout', this.i18n.menu.logout, null, []);

    // Lambda that adds a submenu to a root menu
    const add = (menu: Menu | ActiveMenu, url: string, icon: string, label: string, showIn: MenuType[] = null): MenuEntry => {
      const entry = new MenuEntry(menu, url, icon, label, showIn);
      const root = roots.get(entry.menu.root);
      root.entries.push(entry);
      return entry;
    };

    // Lambda that adds all content pages to the given root menu entry
    const addContentPages = (menu: Menu) => {
      if (restrictedAccess) {
        return;
      }
      const pages = contentPages.filter(p => {
        return p.rootMenu === menu.root && p.isVisible(this.injector);
      });
      for (const page of pages) {
        const activeMenu = new ActiveMenu(menu, {
          contentPage: page.slug
        });
        add(activeMenu, `/page/${page.slug}`, page.icon, page.label);
      }
      return pages;
    };


    // Lambda that adds all custom operations the given root menu entry
    const addOperations = (root: RootMenu) => {
      if (restrictedAccess) {
        return;
      }
      let opMenu: Menu;
      switch (root) {
        case RootMenu.BANKING:
          opMenu = Menu.RUN_OPERATION_BANKING;
          break;
        case RootMenu.MARKETPLACE:
          opMenu = Menu.RUN_OPERATION_MARKETPLACE;
          break;
        case RootMenu.PERSONAL:
          opMenu = Menu.RUN_OPERATION_PERSONAL;
          break;
        default:
          // Invalid root menu for operations
          return;
      }

      const doAddOperations = (path: string, ops: Operation[]) => {
        for (const op of ops) {
          const activeMenu = new ActiveMenu(opMenu, { operation: op });
          const icon = this.operationHelper.icon(op);
          add(activeMenu, `/operations/${path}/${ApiHelper.internalNameOrId(op)}`, icon, op.label);
        }
      };

      // Add both system and self operations
      doAddOperations('system', systemOperations.filter(o => ApiHelper.adminMenuMatches(root, o.adminMenu)));
      doAddOperations('self', userOperations.filter(o => ApiHelper.userMenuMatches(root, o.userMenu)));
    };

    // Add the submenus
    if (restrictedAccess) {
      // No menus in restricted access
    } else if (user == null) {
      // Guest
      add(Menu.HOME, '/', home.icon, home.label);
      if (users.search || users.map) {
        add(Menu.PUBLIC_DIRECTORY, '/users/search', publicDirectory.icon, publicDirectory.label);
      }
      if (marketplace.search) {
        add(Menu.PUBLIC_MARKETPLACE, '/marketplace/search', publicMarketplace.icon, publicMarketplace.label);
      }
      const registrationGroups = (this.dataForUiHolder.dataForUi || {}).publicRegistrationGroups || [];
      if (registrationGroups.length > 0) {
        add(Menu.PUBLIC_REGISTRATION, '/users/registration', register.icon, register.label);
      }
      add(Menu.LOGIN, Configuration.externalLoginUrl || '/login', login.icon, login.label);
    } else {
      // Logged user
      add(Menu.DASHBOARD, '/', dashboard.icon, dashboard.label);

      const banking = permissions.banking || {};
      const contacts = permissions.contacts || {};
      const operators = permissions.operators || {};

      // Banking
      const accountTypes = this.bankingHelper.ownerAccountTypes();
      if (accountTypes.length > 0) {
        for (const type of accountTypes) {
          const activeMenu = new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: type });
          const label = auth.role !== RoleEnum.ADMINISTRATOR && accountTypes.length === 1 ? this.i18n.menu.bankingAccount : type.name;
          add(activeMenu, `/banking/account/${ApiHelper.internalNameOrId(type)}`, 'account_balance', label);
        }
      }
      const payments = banking.payments || {};
      if (payments.user) {
        add(Menu.PAYMENT_TO_USER, '/banking/payment', 'payment', this.i18n.menu.bankingPayUser);
      }
      if (payments.self) {
        add(Menu.PAYMENT_TO_SELF, '/banking/payment/self', 'payment', this.i18n.menu.bankingPaySelf);
      }
      if (payments.system) {
        add(Menu.PAYMENT_TO_SYSTEM, '/banking/payment/system', 'payment', this.i18n.menu.bankingPaySystem);
      }
      const scheduledPayments = (banking.scheduledPayments || {});
      const recurringPayments = (banking.recurringPayments || {});
      if (scheduledPayments.view || recurringPayments.view) {
        add(Menu.SCHEDULED_PAYMENTS, '/banking/scheduled-payments', 'schedule', this.i18n.menu.bankingScheduledPayments);
      }
      if ((banking.authorizations || {}).view) {
        add(Menu.AUTHORIZED_PAYMENTS, '/banking/authorized-payments', 'assignment_turned_in', this.i18n.menu.bankingAuthorizations);
      }
      if (/* PERMISSION VALIDATION */ this.login.auth.role === RoleEnum.MEMBER) { // FIX ICON
        add(Menu.REDEEM_VOUCHER, '/banking/vouchers/redeem', 'payment', this.i18n.menu.bankingVouchersRedeem);
        add(Menu.SEARCH_REDEEMED, '/banking/vouchers/search-redeemed', 'search', this.i18n.menu.bankingVouchersSearchRedeemed);
      }
      addOperations(RootMenu.BANKING);
      addContentPages(Menu.CONTENT_PAGE_BANKING);

      // Operators
      if (operators.enable) {
        add(Menu.MY_OPERATORS, '/users/operators', 'supervisor_account', this.i18n.menu.operatorsOperators);
      }

      // Brokering
      if (auth.role === RoleEnum.BROKER) {
        add(Menu.MY_BROKERED_USERS, '/users/brokerings', 'supervisor_account', this.i18n.menu.brokeringUsers);
        if (users.registerAsBroker) {
          add(Menu.BROKER_REGISTRATION, '/users/registration', 'registration', this.i18n.menu.brokeringRegister);
        }
      }

      // Marketplace
      if (users.search || users.map) {
        add(Menu.SEARCH_USERS, '/users/search', 'group', role === RoleEnum.ADMINISTRATOR
          ? this.i18n.menu.marketplaceUserSearch : this.i18n.menu.marketplaceBusinessDirectory);
      }
      if (users.registerAsAdmin) {
        add(Menu.ADMIN_REGISTRATION, '/users/registration', 'registration', this.i18n.menu.marketplaceRegister);
      }
      if (marketplace.search) {
        add(Menu.SEARCH_ADS, '/marketplace/search', 'shopping_cart', this.i18n.menu.marketplaceAdvertisements);
      } else if (role !== RoleEnum.ADMINISTRATOR) {
        // As the search ads won't be visible, show as user directory instead
        marketplaceRoot.icon = publicDirectory.icon;
        marketplaceRoot.label = publicDirectory.label;
        marketplaceRoot.title = publicDirectory.label;
      }
      addOperations(RootMenu.MARKETPLACE);
      addContentPages(Menu.CONTENT_PAGE_MARKETPLACE);

      // Personal
      const myProfile = permissions.myProfile || {};
      add(Menu.MY_PROFILE, '/users/profile', 'account_box', this.i18n.menu.personalViewProfile);
      if (myProfile.editProfile) {
        add(Menu.EDIT_MY_PROFILE, '/users/profile/edit', 'account_box', this.i18n.menu.personalEditProfile, [MenuType.SIDENAV]);
      }
      if (contacts.enable) {
        add(Menu.CONTACTS, '/users/contacts', 'import_contacts', this.i18n.menu.personalContacts);
      }
      if ((permissions.passwords || {}).manage) {
        let passwordsLabel: string;
        if ((permissions.passwords.passwords || []).length === 1) {
          passwordsLabel = this.i18n.menu.personalPassword;
        } else {
          passwordsLabel = this.i18n.menu.personalPasswords;
        }
        add(Menu.PASSWORDS, '/personal/passwords', 'vpn_key', passwordsLabel);
      }
      if ((permissions.notifications || {}).enable) {
        add(Menu.NOTIFICATIONS, '/personal/notifications', 'notifications', this.i18n.menu.personalNotifications);
      }
      add(Menu.SETTINGS, '/personal/settings', 'settings', this.i18n.menu.personalSettings);
      addOperations(RootMenu.PERSONAL);
      addContentPages(Menu.CONTENT_PAGE_PERSONAL);

      // Add the logout
      add(Menu.LOGOUT, null, logout.icon, logout.label, logout.showIn);
    }

    // Content pages in the content root menu
    const pagesInContent = addContentPages(Menu.CONTENT_PAGE_CONTENT);

    // For guests, content will always be dropdown.
    // For logged users, only if at least 1 content page with layout full is used
    content.dropdown = user == null || (pagesInContent || []).findIndex(p => p.layout === 'full') >= 0;

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

  /**
   * Resolves the given menu or conditional menu to an actual `Menu`.
   * @param value Either a `Menu` or `ConditionalMenu`
   */
  resolveMenu(value: Menu | ConditionalMenu | ((i: Injector) => any)): Observable<ActiveMenu> {
    if (value instanceof Function) {
      const result = value(this.injector);
      if (result instanceof Menu) {
        return of(new ActiveMenu(result));
      } else if (result instanceof ActiveMenu) {
        return of(result);
      } else if (result instanceof Observable) {
        return result.pipe(map(m => m instanceof ActiveMenu ? m : new ActiveMenu(m)));
      }
    } else if (value instanceof Menu) {
      return of(new ActiveMenu(value));
    } else {
      return of(value);
    }
  }

}
