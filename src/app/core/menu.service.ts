import { Injectable, Injector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Auth, DataForUi } from 'app/api/models';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LoginService } from 'app/core/login.service';
import { StateManager } from 'app/core/state-manager';
import { Messages } from 'app/messages/messages';
import { ApiHelper } from 'app/shared/api-helper';
import { LayoutService } from 'app/shared/layout.service';
import { ConditionalMenu, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry, SideMenuEntries } from 'app/shared/menu';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

/**
 * Contains information about the active menu
 */
export class ActiveMenu {
  constructor(
    public menu: Menu,
    public accountTypeId?: string,
    public contentPageSlug?: string) {
  }

  matches(entry: MenuEntry): boolean {
    return entry.menu === this.menu
      && (entry.accountTypeId || '') === (this.accountTypeId || '')
      && (entry.contentPageSlug || '') === (this.contentPageSlug || '');
  }
}

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {

  /**
   * The current active menu descriptor
   */
  activeMenu$: Observable<ActiveMenu>;
  private _activeMenu = new BehaviorSubject<ActiveMenu>(null);

  get activeMenu(): ActiveMenu {
    return this._activeMenu.value;
  }

  private _fullMenu = new BehaviorSubject<RootMenuEntry[]>(null);
  get fullMenu(): RootMenuEntry[] {
    return this._fullMenu.value;
  }

  constructor(
    private messages: Messages,
    private injector: Injector,
    private dataForUiHolder: DataForUiHolder,
    private router: Router,
    private login: LoginService,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager,
    private content: ContentService,
    layout: LayoutService
  ) {
    const initialDataForUi = this.dataForUiHolder.dataForUi;
    const initialAuth = (initialDataForUi || {}).auth;

    // If initially with a DataForUi instance and using static locale
    if (initialDataForUi != null && this.dataForUiHolder.staticLocale) {
      this._fullMenu.next(this.buildFullMenu(initialAuth));
    }

    // Whenever the authenticated user changes, reload the menu
    const buildMenu = (dataForUi: DataForUi) => {
      if (this.messages.initialized$.value) {
        const auth = (dataForUi || {}).auth;
        this._fullMenu.next(this.buildFullMenu(auth));
        this._activeMenu.next(null);
      }
    };
    dataForUiHolder.subscribe(buildMenu);
    dataForUiHolder.subscribeForLocale(() => buildMenu(dataForUiHolder.dataForUi));

    // Whenever we navigate back to home, update the active menu to match
    router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => e as NavigationEnd),
      filter(e => e.url === '/' || e.url === '/home')
    ).subscribe(e => {
      const entry = this.menuEntry(e.url);
      if (entry) {
        this.updateActiveMenuFromEntry(entry);
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
   * Navigates to a menu entry
   */
  navigate(entry: MenuEntry, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
      const target = event.target as HTMLElement;
      target.blur();
    }

    // Clear the shared state
    this.breadcrumb.clear();
    this.stateManager.clear();

    // Either perform the logout or navigate
    if (entry.menu === Menu.LOGOUT) {
      this.login.logout();
    } else {
      this.router.navigateByUrl(entry.url);
    }

    // Update the active state
    this.updateActiveMenuFromEntry(entry);
  }

  /**
   * Sets the active menu
   */
  setActiveMenu(menu: Menu | ConditionalMenu): void {
    // Whenever the last selected menu changes, update the classes in the body element
    this.resolveMenu(menu).pipe(first()).subscribe(m => this.updateActiveMenu(m, null, null));
  }

  /**
   * Sets the id of the active account type from the menu.
   */
  setActiveAccountTypeId(id: string): void {
    this.updateActiveMenu(Menu.ACCOUNT_HISTORY, id, null);
  }

  /**
   * Sets the slug of the active content page.
   */
  setActiveContentPageSlug(slug: string): void {
    const entry = this.contentPageEntry(slug);
    if (entry) {
      this.updateActiveMenu(entry.menu, null, entry.contentPageSlug);
    }
  }


  private updateActiveMenu(menu: Menu, accountTypeId: string, contentPageSlug: string) {
    this._activeMenu.next(new ActiveMenu(menu, accountTypeId, contentPageSlug));
  }

  private updateActiveMenuFromEntry(entry: MenuEntry) {
    const menu = entry.menu === Menu.LOGOUT ? Menu.HOME : entry.menu;
    this._activeMenu.next(new ActiveMenu(menu, entry.accountTypeId, entry.contentPageSlug));
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
      const roots = this._fullMenu.value || [];
      for (const rootEntry of roots) {
        for (const entry of rootEntry.entries || []) {
          if (activeMenu.matches(entry)) {
            return entry;
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
  accountEntry(typeId: string): MenuEntry {
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      for (const entry of rootEntry.entries || []) {
        if (entry.accountTypeId === typeId) {
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
        if (entry.contentPageSlug === slug) {
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
    const home = addRoot(RootMenu.HOME, 'home', this.messages.menu.home, null);
    const dashboard = addRoot(RootMenu.DASHBOARD, 'dashboard', this.messages.menu.dashboard, null);
    const publicDirectory = addRoot(RootMenu.PUBLIC_DIRECTORY, 'group', this.messages.menu.marketplaceDirectory);
    const publicMarketplace = addRoot(RootMenu.PUBLIC_MARKETPLACE, 'shopping_cart', this.messages.menu.marketplaceAdvertisements);
    addRoot(RootMenu.BANKING, 'account_balance', this.messages.menu.banking);
    const marketplaceRoot = addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.messages.menu.marketplace);
    addRoot(RootMenu.PERSONAL, 'account_box', this.messages.menu.personal);
    const content = addRoot(RootMenu.CONTENT, 'info', this.messages.menu.content);
    const register = addRoot(RootMenu.REGISTRATION, 'registration', this.messages.menu.register);
    const login = addRoot(RootMenu.LOGIN, 'exit_to_app', this.messages.menu.login);
    const logout = addRoot(RootMenu.LOGOUT, 'logout', this.messages.menu.logout, null, []);

    // Lambda that adds a submenu to a root menu
    const add = (menu: Menu, url: string, icon: string, label: string, showIn: MenuType[] = null): MenuEntry => {
      const root = roots.get(menu.root);
      const entry = new MenuEntry(menu, url, icon, label, showIn);
      root.entries.push(entry);
      return entry;
    };

    // Lambda that adds all content pages to the given root menu entry
    const addContentPages = (menu: Menu) => {
      const pages = contentPages.filter(p => {
        return p.rootMenu === menu.root && p.isVisible(this.injector);
      });
      for (const page of pages) {
        const entry = add(menu, `/page/${page.slug}`, page.icon, page.label);
        entry.contentPageSlug = page.slug;
      }
      return pages;
    };

    // Add the submenus
    if (restrictedAccess) {
      // No menus in restricted access
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
          const entry = add(Menu.ACCOUNT_HISTORY, '/banking/account/' + ApiHelper.internalNameOrId(type),
            'account_balance', type.name);
          entry.accountTypeId = type.id;
        }
      }
      const payments = banking.payments || {};
      if (payments.user) {
        add(Menu.PAYMENT_TO_USER, '/banking/payment', 'payment', this.messages.menu.bankingPayUser);
      }
      if (payments.self) {
        add(Menu.PAYMENT_TO_SELF, '/banking/payment/self', 'payment', this.messages.menu.bankingPaySelf);
      }
      if (payments.system) {
        add(Menu.PAYMENT_TO_SYSTEM, '/banking/payment/system', 'payment', this.messages.menu.bankingPaySystem);
      }
      const scheduledPayments = (banking.scheduledPayments || {});
      const recurringPayments = (banking.recurringPayments || {});
      if (scheduledPayments.view || recurringPayments.view) {
        add(Menu.SCHEDULED_PAYMENTS, '/banking/scheduled-payments', 'schedule', this.messages.menu.bankingScheduledPayments);
      }
      if ((banking.authorizations || {}).view) {
        add(Menu.AUTHORIZED_PAYMENTS, '/banking/authorized-payments', 'assignment_turned_in', this.messages.menu.bankingAuthorizations);
      }
      addContentPages(Menu.CONTENT_PAGE_BANKING);

      // Marketplace
      if (users.search || users.map) {
        add(Menu.SEARCH_USERS, '/users/search', 'group', this.messages.menu.marketplaceBusinessDirectory);
      }
      if (marketplace.search) {
        add(Menu.SEARCH_ADS, '/marketplace/search', 'shopping_cart', this.messages.menu.marketplaceAdvertisements);
      } else {
        // As the search ads won't be visible, show as user directory instead
        marketplaceRoot.icon = publicDirectory.icon;
        marketplaceRoot.label = publicDirectory.label;
        marketplaceRoot.title = publicDirectory.label;
      }
      addContentPages(Menu.CONTENT_PAGE_MARKETPLACE);

      // Personal
      const myProfile = permissions.myProfile || {};
      add(Menu.MY_PROFILE, '/users/my-profile', 'account_box', this.messages.menu.personalViewProfile,
        [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      if (myProfile.editProfile) {
        add(Menu.EDIT_MY_PROFILE, '/users/my-profile/edit', 'account_box', this.messages.menu.personalEditProfile,
          [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if (contacts.enable) {
        add(Menu.CONTACTS, '/users/contacts', 'import_contacts', this.messages.menu.personalContacts,
          [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if ((permissions.passwords || {}).manage) {
        let passwordsLabel: string;
        if ((permissions.passwords.passwords || []).length === 1) {
          passwordsLabel = this.messages.menu.personalPassword;
        } else {
          passwordsLabel = this.messages.menu.personalPasswords;
        }
        add(Menu.PASSWORDS, '/users/passwords', 'vpn_key', passwordsLabel,
          [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      addContentPages(Menu.CONTENT_PAGE_PERSONAL);
    }

    // Content pages in the content root menu
    const pagesInContent = addContentPages(Menu.CONTENT_PAGE_CONTENT);

    // Add the logout, which doesn't shows in any menu, but is handled when using navigate()
    add(Menu.LOGOUT, null, logout.icon, logout.label, logout.showIn);

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
  resolveMenu(value: Menu | ConditionalMenu): Observable<Menu> {
    if (value instanceof Function) {
      const result = value(this.injector);
      if (result instanceof Menu) {
        value = result;
      } else {
        return result;
      }
    }
    return of(value);
  }
}
