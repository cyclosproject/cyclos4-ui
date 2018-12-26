import { Injectable, Injector } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Auth } from 'app/api/models';
import { ContentPage } from 'app/content/content-page';
import { handleFullWidthLayout } from 'app/content/content-with-layout';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LoginService } from 'app/core/login.service';
import { StateManager } from 'app/core/state-manager';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { ConditionalMenu, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry, SideMenuEntries } from 'app/shared/menu';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { distinctUntilChanged, first, map, filter } from 'rxjs/operators';

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

const VALID_CONTENT_PAGES_ROOT_MENUS = [RootMenu.CONTENT, RootMenu.BANKING, RootMenu.MARKETPLACE, RootMenu.PERSONAL];
/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {

  /** All current content pages */
  contentPages$: Observable<ContentPage[]>;

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

  private _contentPages = new BehaviorSubject<ContentPage[]>(null);

  constructor(
    private i18n: I18n,
    private injector: Injector,
    private dataForUiHolder: DataForUiHolder,
    private router: Router,
    private login: LoginService,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager,
    layout: LayoutService
  ) {
    const initialDataForUi = this.dataForUiHolder.dataForUi;
    const initialAuth = (initialDataForUi || {}).auth;

    if (initialDataForUi != null) {
      this.buildFullMenu(initialAuth).subscribe(m => this._fullMenu.next(m));
    }
    // Whenever the authenticated user changes, reload the menu
    dataForUiHolder.subscribe(dataForUi => {
      const auth = (dataForUi || {}).auth;
      this.buildFullMenu(auth).subscribe(m => this._fullMenu.next(m));
      this._activeMenu.next(null);
    });

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

    this.contentPages$ = this._contentPages.asObservable().pipe(
      distinctUntilChanged()
    );
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
  private buildFullMenu(maybeNullAuth: Auth): Observable<RootMenuEntry[]> {
    const contentPagesResolver = environment.contentPagesResolver;
    let contentPages: ContentPage[] | Observable<ContentPage[]>;
    if (contentPagesResolver instanceof Array) {
      // The resolver is already the list of content pages
      contentPages = contentPagesResolver;
    } else if (contentPagesResolver == null) {
      // There is no resolver - no content pages
      contentPages = [];
    } else {
      // The resolver is a 'resolver'
      contentPages = contentPagesResolver.resolveContentPages(this.injector) || [];
    }
    if (contentPages instanceof Array) {
      // The pages are already available
      return of(this.doBuildFullMenu(maybeNullAuth, contentPages));
    } else {
      // First fetch the content pages, then build the menu
      return contentPages.pipe(
        map(p => this.doBuildFullMenu(maybeNullAuth, p))
      );
    }
  }

  private doBuildFullMenu(maybeNullAuth: Auth, contentPages: ContentPage[]): RootMenuEntry[] {
    const auth = maybeNullAuth || {};
    const permissions = auth.permissions;
    const user = auth.user;
    const restrictedAccess = auth.expiredPassword || auth.pendingAgreements;
    const users = permissions.users || {};
    const marketplace = permissions.marketplace || {};

    // Preprocess and store the content pages
    contentPages = this.preprocessContentPages(contentPages);
    this._contentPages.next(contentPages);

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
    const content = addRoot(RootMenu.CONTENT, 'info', this.i18n({ value: 'Information', description: 'Menu' }));
    const register = addRoot(RootMenu.REGISTRATION, 'registration', this.i18n({ value: 'Register', description: 'Menu' }));
    const login = addRoot(RootMenu.LOGIN, 'exit_to_app', this.i18n({ value: 'Login', description: 'Menu' }));
    const logout = addRoot(RootMenu.LOGOUT, 'logout', this.i18n({ value: 'Logout', description: 'Menu' }), null, []);

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
        return (p.rootMenu === menu.root
          && (user == null && p.guests !== false
            || user != null && p.loggedUsers !== false));
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
      addContentPages(Menu.CONTENT_PAGE_BANKING);

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
      addContentPages(Menu.CONTENT_PAGE_MARKETPLACE);

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

  private preprocessContentPages(contentPages: ContentPage[]): ContentPage[] {
    contentPages = (contentPages || []).filter(p => p != null);
    let nextId = 0;
    for (const page of contentPages) {
      handleFullWidthLayout(page);
      if (empty(page.label)) {
        page.label = page.title || 'Untitled page';
      }
      if (empty(page.icon)) {
        page.icon = 'description';
      }
      if (empty(page.slug)) {
        page.slug = `page_${++nextId}`;
      } else {
        // Make sure the slug doesn't contain invalid characters
        page.slug = page.slug.replace(/[\/\?\#\s\%\:]/g, '-');
      }
      if (!VALID_CONTENT_PAGES_ROOT_MENUS.includes(page.rootMenu)) {
        page.rootMenu = RootMenu.CONTENT;
      }
    }
    return contentPages;
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
