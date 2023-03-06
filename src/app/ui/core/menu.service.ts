import { Inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  AccountType, AccountWithOwner, AdminMenuEnum, DataForFrontend,

  FrontendMenuEnum, ImportedFileKind, Operation,
  RecordLayoutEnum, RecordPermissions, RecordType, RoleEnum, TokenType, Transfer, User,
  UserLocale,
  UserMenuEnum, UserRelationshipEnum, VouchersPermissions, Wizard
} from 'app/api/models';
import { UsersService } from 'app/api/services/users.service';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { CacheService } from 'app/core/cache.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { NextRequestState } from 'app/core/next-request-state';
import { StateManager } from 'app/core/state-manager';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { empty, toFullUrl, truthyAttr } from 'app/shared/helper';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { LoginService } from 'app/ui/core/login.service';
import { MapsService } from 'app/ui/core/maps.service';
import { OperationHelperService } from 'app/ui/core/operation-helper.service';
import { RecordHelperService } from 'app/ui/core/records-helper.service';
import { TokenHelperService } from 'app/ui/core/token-helper.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { WizardHelperService } from 'app/ui/core/wizard-helper.service';
import { ActiveMenu, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry, SideMenuEntries } from 'app/ui/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

enum NavigateAction {
  Url,
  Logout,
  Locale
}

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

  /** Replace current URL */
  replaceUrl?: boolean;

  /** Whether the clear the current navigation (default) or not */
  clear?: boolean;

  /** An UI event to cancel */
  event?: Event;
}

interface ResolvedVouchersPermissions {
  view: boolean;
  generate: boolean;
  viewVouchers: boolean;
  buy: boolean;
  send: boolean;
  viewTransactions: boolean;
  redeem: boolean;
  topUp: boolean;
}

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable({
  providedIn: 'root',
})
export class MenuService {

  get activeMenu(): ActiveMenu {
    return this._activeMenu.value;
  }
  get fullMenu(): RootMenuEntry[] {
    return this._fullMenu.value;
  }

  constructor(
    @Inject(I18nInjectionToken) private i18n: I18n,
    private dataForFrontendHolder: DataForFrontendHolder,
    i18nLoading: I18nLoadingService,
    private router: Router,
    private login: LoginService,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager,
    private bankingHelper: BankingHelperService,
    private operationHelper: OperationHelperService,
    private wizardHelper: WizardHelperService,
    private recordHelper: RecordHelperService,
    private authHelper: AuthHelperService,
    private tokenHelper: TokenHelperService,
    private cache: CacheService,
    private usersService: UsersService,
    private uiLayout: UiLayoutService,
    private nextRequestState: NextRequestState,
    private mapService: MapsService
  ) {

    // Whenever the authenticated user, translations or content pages changes, reload the menu
    const buildMenu = (dataForFrontend: DataForFrontend) => {
      if (this.i18n.initialized$.value) {
        this._fullMenu.next(this.buildFullMenu((dataForFrontend || {})));
        this._activeMenu.next(null);
      }
    };
    dataForFrontendHolder.subscribe(buildMenu);
    i18nLoading.subscribeForLocale(() => buildMenu(dataForFrontendHolder.dataForFrontend));

    // Whenever we navigate back to home, update the active menu to match
    router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => e as NavigationEnd),
      filter(e => e.url === '/' || e.url === '/home'),
    ).subscribe(e => {
      const entry = this.menuEntry(e.url);
      if (entry) {
        this.setActiveMenu(entry.activeMenu);
      }
    });

    this._activeMenu.subscribe(active => {
      // Update the body classes
      this.updateBodyClasses(active ? active.menu : null);
    });
    this.activeMenu$ = this._activeMenu.asObservable();
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
    let action = NavigateAction.Url;
    let locale: UserLocale;
    let url: string;

    if ((params.menu && params.menu.menu === Menu.LOGOUT)
      || params.entry && params.entry.menu === Menu.LOGOUT) {
      // Logout
      action = NavigateAction.Logout;
    } else if (params.entry?.locale) {
      // Switch locale
      action = NavigateAction.Locale;
      locale = params.entry.locale;
    } else if (params.url) {
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

    // Perform the action
    if (action === NavigateAction.Logout) {
      this.login.logout();
    } else if (action === NavigateAction.Locale) {
      this.authHelper.setLocale(locale);
    } else if (url && url.startsWith('http')) {
      // An absolute URL
      const absoluteRoot = toFullUrl('/');
      if (url.startsWith(absoluteRoot)) {
        // Is an internal link
        url = url.substring(absoluteRoot.length);
        this.router.navigateByUrl(url, { replaceUrl: !!params.replaceUrl });
      } else {
        // Is an external link - all we can do is assign the location
        this.nextRequestState.willExternalRedirect();
        location.assign(url);
      }
    } else if (url) {
      this.router.navigateByUrl(url, { replaceUrl: !!params.replaceUrl });
    }

    // Update the active state
    if (params.menu) {
      this.setActiveMenu(params.menu);
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
  setActiveMenu(menu: ActiveMenu | Menu): void {
    if (menu == null) {
      this._activeMenu.next(null);
      return;
    }
    if (menu instanceof Menu) {
      menu = new ActiveMenu(menu);
    }
    if (menu.menu === Menu.LOGOUT) {
      menu = new ActiveMenu(Menu.HOME);
    }
    this._activeMenu.next(menu);

    // Update the visible banners as well
    const activeMenu = menu;
    this.uiLayout.banners = this.dataForFrontendHolder.banners.filter(b => empty(b.menus)
      || b.menus.find(m => this.menuMatchesEnum(activeMenu.menu, m)));

  }

  private updateBodyClasses(menu: Menu) {
    const classes = document.body.classList;
    Object.values(RootMenu).forEach(root => {
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
    if (op == null) {
      return null;
    }
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      for (const entry of rootEntry.entries || []) {
        const data = entry.activeMenu.data;
        const operation = data == null ? null : data.operation;
        if (operation && (operation.id === op || operation.internalName === op)) {
          return entry;
        }
      }
    }
    return null;
  }

  /**
   * Returns the available `MenuEntry` for the wizard with the given id or internal name
   * @param w The wizard id or internal name
   */
  wizardEntry(w: string): MenuEntry {
    const roots = this._fullMenu.value || [];
    for (const rootEntry of roots) {
      for (const entry of rootEntry.entries || []) {
        const data = entry.activeMenu.data;
        const wizard = data == null ? null : data.wizard;
        if (wizard && (wizard.id === w || wizard.internalName === w)) {
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
      }),
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
          return new SideMenuEntries(null, null, []);
        }
        return new SideMenuEntries(root.title, root.icon, root.entries);
      }),
    );
  }

  /**
   * Returns whether the given frontend root menu matches the Cyclos root menu for an administrator function.
   */
  adminMenuMatches(root: RootMenu, adminMenu: AdminMenuEnum) {
    if (adminMenu === AdminMenuEnum.SYSTEM_BANKING) {
      return root === RootMenu.BANKING;
    } else {
      return root === RootMenu.MARKETPLACE;
    }
  }

  /**
   * Returns whether the given frontend root menu matches the Cyclos root menu for a user function.
   */
  userMenuMatches(root: RootMenu, userMenu: UserMenuEnum) {
    switch (userMenu) {
      case UserMenuEnum.BANKING:
        return root === RootMenu.BANKING;
      case UserMenuEnum.COMMUNITY:
      case UserMenuEnum.MARKETPLACE:
        return root === RootMenu.MARKETPLACE;
      case UserMenuEnum.PERSONAL:
        return root === RootMenu.PERSONAL;
      default:
        return false;
    }
  }

  /**
   * Returns, amongst the list of possible menus, the one whose root menu matches one of the given Cyclos menus
   */
  matchingMenu(possible: Menu[], adminMenu: AdminMenuEnum, userMenu: UserMenuEnum): Menu {
    for (const current of possible) {
      if ((adminMenu && this.adminMenuMatches(current.root, adminMenu)) ||
        (userMenu && this.userMenuMatches(current.root, userMenu))) {
        return current;
      }
    }
  }

  /**
   * Returns the menu for running an own custom operation, according to the given operation type.
   * This works for both system-scoped operations or user-scoped operations for the current user.
   * @param operation The operation
   */
  menuForOwnerOperation(operation: Operation): Menu {
    const possibleMenus = [
      Menu.RUN_OPERATION_BANKING, Menu.RUN_OPERATION_MARKETPLACE, Menu.RUN_OPERATION_PERSONAL
    ];
    return this.matchingMenu(possibleMenus, operation.adminMenu, operation.userMenu);
  }

  /**
   * Returns the menu for running a custom wizard
   */
  menuForWizard(wizard: Wizard) {
    const possibleMenus = [
      Menu.RUN_WIZARD_BANKING, Menu.RUN_WIZARD_MARKETPLACE, Menu.RUN_WIZARD_PERSONAL
    ];
    return this.matchingMenu(possibleMenus, wizard.adminMenu, wizard.userMenu);
  }

  /**
   * Returns the home menu, which is `Menu.HOME` for guests (except if disabled, in this case, 'Menu.LOGIN'),
   * or `Menu.DASHBOARD` for logged users.
   */
  homeMenu(): Menu {
    const hasHomePage = this.dataForFrontendHolder.dataForFrontend?.hasHomePage;
    return this.dataForFrontendHolder.user ? Menu.DASHBOARD : hasHomePage ? Menu.HOME : Menu.LOGIN;
  }

  /**
   * Returns a menu according to the relation between the logged user and the given user (using `isSelfOrOwner`).
   * If self, returns the `selfMenu`. Otherwise, returns the menu to search users.
   * @param user The user being tested
   * @param selfMenu The menu when the user is self
   */
  userMenu(user: User, selfMenu: Menu | ActiveMenu): Menu | ActiveMenu | Observable<Menu | ActiveMenu> {
    return this.authHelper.isSelfOrOwner(user) ? selfMenu : this.searchUsersMenu(user);
  }

  /**
   * Returns the menu the authenticated user is expected to use to find the given user / operator:
   *
   * - Guests use `Menu.PUBLIC_DIRECTORY`.
   * - Own user use `Menu.MY_PROFILE`
   * - Own operator use `Menu.MY_OPERATORS`
   * - Members / admins always use `Menu.SEARCH_USERS`.
   * - Brokers are problemmatic, as we need to know whether the logged user is a broker of the given user or not,
   *   returning either `Menu.MY_BROKERED_USERS` or `Menu.SEARCH_USERS`.
   * @param user The user to test
   */
  searchUsersMenu(user?: User): Menu | Observable<Menu> {
    if (user) {
      if (this.authHelper.isSelf(user)) {
        // Own user
        return Menu.MY_PROFILE;
      } else if (user.user) {
        // The given user is an operator. Check if own or other.
        if (this.authHelper.isSelf(user.user)) {
          return Menu.MY_OPERATORS;
        }
        // Keep on, considering the operator owner as user
        user = user.user;
      }
    }

    // Determine the relationship between the user and the logged user
    const role = this.dataForFrontendHolder.role;
    if (role == null) {
      return Menu.PUBLIC_DIRECTORY;
    } else if (role === RoleEnum.BROKER) {
      if (!user) {
        // We don't know the user. Assume as broker.
        return Menu.MY_BROKERED_USERS;
      }
      // Broker is a problematic case, because the relation between the logged user may be either of manager or regular
      return this.cache.get(`broker_${this.dataForFrontendHolder.user.id}_${user.id}`, () => {
        return this.usersService
          .viewUser({ user: user.id, fields: ['relationship'] })
          .pipe(
            map(v => v.relationship === UserRelationshipEnum.BROKER)
          );
      }).pipe(
        map(isBroker => truthyAttr(isBroker) ? Menu.MY_BROKERED_USERS : Menu.SEARCH_USERS)
      );
    } else {
      // All other cases of non-self users are via search users
      return Menu.SEARCH_USERS;
    }
  }

  /**
   * Returns the menu for the given transfer. Optionally receives an expected account.
   */
  transferMenu(transfer: Transfer, accountId?: string) {
    if (accountId) {
      const auth = this.dataForFrontendHolder.auth || {};
      const permissions = auth.permissions || {};
      const banking = permissions.banking || {};
      const accounts = banking.accounts || [];
      const account = accounts.map(a => a.account).find(a => a.id === accountId);
      if (account) {
        return new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: account.type });
      }
    }
    return this.accountMenu(transfer.from, transfer.to);
  }

  /**
   * Returns the menu for one of the given accounts
   */
  accountMenu(from: AccountWithOwner, to: AccountWithOwner) {
    let account: AccountWithOwner = null;
    if (from || to) {
      if (!from || !to) {
        account = from || to;
      } else {
        const fromSelf = this.authHelper.isSelf(from);
        const toSelf = this.authHelper.isSelf(to);
        if (fromSelf || toSelf) {
          account = fromSelf ? from.type : to.type;
        }
      }
    }
    if (account && this.authHelper.isSelfOrOwner(account.user)) {
      // We have to assume we're viewing a self acount
      return new ActiveMenu(Menu.ACCOUNT_HISTORY, {
        accountType: account.type,
      });
    }
    return this.searchUsersMenu();
  }

  /**
   * Returns the active menu for the given record type.
   */
  menuForRecordType(user: User, type: RecordType): Menu | ActiveMenu | Observable<Menu> {
    if (!user || this.authHelper.isSelf(user)) {
      return this.activeMenuForRecordType(!user, type);
    } else {
      return this.searchUsersMenu(user);
    }
  }

  /**
   * Returns the ActiveMenu which represents this record type.
   */
  activeMenuForRecordType(general: boolean, type: RecordType): ActiveMenu {
    if (!type) {
      return null;
    }
    let menu: Menu;
    if (general) {
      // General records search
      const auth = this.dataForFrontendHolder.auth || {};
      menu = auth.role === RoleEnum.BROKER ? Menu.SEARCH_RECORDS_BROKERING : Menu.SEARCH_RECORDS_MARKETPLACE;
    } else if (type.adminMenu) {
      // System record type
      menu = type.adminMenu === AdminMenuEnum.SYSTEM_BANKING
        ? Menu.SEARCH_RECORDS_BANKING : Menu.SEARCH_RECORDS_MARKETPLACE;
    } else if (type.userMenu) {
      // My record type
      switch (type.userMenu) {
        case UserMenuEnum.BANKING:
          menu = Menu.SEARCH_RECORDS_BANKING;
          break;
        case UserMenuEnum.PERSONAL:
          menu = Menu.SEARCH_RECORDS_PERSONAL;
          break;
        default:
          menu = Menu.SEARCH_RECORDS_MARKETPLACE;
          break;
      }
    } else {
      // Fallback
      menu = Menu.SEARCH_RECORDS_MARKETPLACE;
    }
    return new ActiveMenu(menu, { recordType: type });
  }


  /**
   * Returns the ActiveMenu which represents this token type.
   */
  activeMenuForTokenType(type: TokenType): ActiveMenu {
    if (!type) {
      return null;
    }
    return new ActiveMenu(Menu.MY_TOKENS, { tokenType: type });
  }

  /**
   * Returns whethere a given frontend menu matches the API menu enum
   */
  menuMatchesEnum(menu: Menu, menuEnum: FrontendMenuEnum) {
    if (menuEnum === FrontendMenuEnum.USERS) {
      // Special case: match the user-related pages in the marketplace root menu
      return menu === Menu.SEARCH_USERS;
    }
    return this.rootMenuForEnum(menuEnum) === menu.root;
  }

  /**
   * Returns the RootMenu for a given FrontendMenu
   */
  rootMenuForEnum(menu: FrontendMenuEnum) {
    switch (menu) {
      case FrontendMenuEnum.BANKING:
        return RootMenu.BANKING;
      case FrontendMenuEnum.BROKERING:
        return RootMenu.BROKERING;
      case FrontendMenuEnum.CONTENT:
        return RootMenu.CONTENT;
      case FrontendMenuEnum.DASHBOARD:
        return RootMenu.DASHBOARD;
      case FrontendMenuEnum.HOME:
        return RootMenu.HOME;
      case FrontendMenuEnum.LOGIN:
        return RootMenu.LOGIN;
      case FrontendMenuEnum.MARKETPLACE:
      case FrontendMenuEnum.USERS:
        return RootMenu.MARKETPLACE;
      case FrontendMenuEnum.OPERATORS:
        return RootMenu.OPERATORS;
      case FrontendMenuEnum.PERSONAL:
        return RootMenu.PERSONAL;
      case FrontendMenuEnum.PUBLIC_DIRECTORY:
        return RootMenu.PUBLIC_DIRECTORY;
      case FrontendMenuEnum.PUBLIC_MARKETPLACE:
        return RootMenu.PUBLIC_MARKETPLACE;
      case FrontendMenuEnum.REGISTRATION:
        return RootMenu.REGISTRATION;
    }
  }

  /**
   * Build the full menu structure from the given authentication
   */
  private buildFullMenu(data: DataForFrontend): RootMenuEntry[] {
    const contentPages = data.pages || [];

    const auth = data.dataForUi.auth || {};
    const role = auth == null ? null : auth.role;
    const isAdmin = role === RoleEnum.ADMINISTRATOR;
    const isBroker = role === RoleEnum.BROKER;
    const permissions = auth.permissions || {};
    const user = auth.user;
    const restrictedAccess = this.authHelper.restrictedAccess;
    const users = permissions.users || {};
    const marketplace = permissions.marketplace || {};
    const operations = permissions.operations || {};
    const wizards = permissions.wizards || {};
    const vouchers = this.resolveVoucherPermissions(permissions.vouchers || {});
    const records = permissions.records || {};

    const roots = new Map<RootMenu, RootMenuEntry>();
    // Lambda that adds a root menu
    const addRoot = (root: RootMenu, icon: SvgIcon | string, label: string, title: string = null, showIn: MenuType[] = null) => {
      const entry = new RootMenuEntry(root, icon, label, title, showIn);
      roots.set(root, entry);
      return entry;
    };
    // Create the root menu entries
    const home = addRoot(RootMenu.HOME, SvgIcon.HouseDoor2, this.i18n.menu.home, null);
    const dashboard = addRoot(RootMenu.DASHBOARD, SvgIcon.Grid2, this.i18n.menu.dashboard, null);
    const publicDirectory = addRoot(RootMenu.PUBLIC_DIRECTORY, SvgIcon.People, this.i18n.menu.marketplaceDirectory);
    const publicMarketplace = addRoot(RootMenu.PUBLIC_MARKETPLACE, SvgIcon.Bag2, this.i18n.menu.marketplaceAdvertisements);
    addRoot(RootMenu.BANKING, SvgIcon.Wallet3, this.i18n.menu.banking);
    addRoot(RootMenu.OPERATORS, SvgIcon.PersonCircleOutline, this.i18n.menu.operators);
    addRoot(RootMenu.BROKERING, SvgIcon.PersonSquareOutline, this.i18n.menu.brokering);
    const marketplaceRoot = addRoot(RootMenu.MARKETPLACE, SvgIcon.Shop2, this.i18n.menu.marketplace);
    const content = addRoot(RootMenu.CONTENT, SvgIcon.InfoCircle, this.i18n.menu.content);
    addRoot(RootMenu.PERSONAL, SvgIcon.Person, this.i18n.menu.personal, null, [MenuType.SIDENAV, MenuType.BAR, MenuType.SIDE]);
    const register = addRoot(RootMenu.REGISTRATION, SvgIcon.PersonPlus, this.i18n.menu.register, null, [MenuType.SIDENAV]);
    const login = addRoot(RootMenu.LOGIN, SvgIcon.Login2, this.i18n.menu.login, null, [MenuType.SIDENAV]);
    const logout = addRoot(RootMenu.LOGOUT, SvgIcon.Logout2, this.i18n.menu.logout, null, []);

    // Lambda that adds a submenu to a root menu
    const add = (
      menu: Menu | ActiveMenu, url: string, icon: SvgIcon | string, label: string,
      showIn: MenuType[] = null, urlHandler: () => string = null): MenuEntry => {
      const entry = new MenuEntry(menu, url, icon, label, showIn, urlHandler);
      const root = roots.get(entry.menu.root);
      root.entries.push(entry);
      return entry;
    };

    // Lambda that adds all content pages to the given root menu entry
    const addContentPages = (menu: Menu) => {
      if (restrictedAccess) {
        return;
      }
      const pages = (contentPages || []).filter(p => {
        return this.rootMenuForEnum(p.menu) === menu.root;
      });
      for (const page of pages) {
        const slug = ApiHelper.internalNameOrId(page);
        const activeMenu = new ActiveMenu(menu, {
          contentPage: slug,
        });
        add(activeMenu, `/page/${slug}`, page.svgIcon || SvgIcon.FileEarmarkText, page.name);
      }
      return pages;
    };

    // Lambda that adds all custom operations the given root menu entry
    const systemOperations = (operations.system || []).filter(o => o.run).map(o => o.operation);
    const userOperations = (operations.user || []).filter(o => o.run).map(o => o.operation);
    const addOperations = (root: RootMenu) => {
      if (restrictedAccess) {
        return;
      }
      let operationMenu: Menu;
      switch (root) {
        case RootMenu.BANKING:
          operationMenu = Menu.RUN_OPERATION_BANKING;
          break;
        case RootMenu.MARKETPLACE:
          operationMenu = Menu.RUN_OPERATION_MARKETPLACE;
          break;
        case RootMenu.PERSONAL:
          operationMenu = Menu.RUN_OPERATION_PERSONAL;
          break;
        default:
          // Invalid root menu for operations
          return;
      }

      const doAddOperations = (path: string, ops: Operation[]) => {
        for (const op of ops) {
          const activeMenu = new ActiveMenu(operationMenu, { operation: op });
          const icon = this.operationHelper.icon(op);
          add(activeMenu, `/operations/${path}/${ApiHelper.internalNameOrId(op)}`, icon, op.label);
        }
      };

      // Add both system and self operations
      doAddOperations('system', systemOperations.filter(o => this.adminMenuMatches(root, o.adminMenu)));
      doAddOperations('self', userOperations.filter(o => this.userMenuMatches(root, o.userMenu)));
    };


    // Lambda that adds all wizards the given root menu entry
    const systemWizards = (wizards.system || []).filter(w => w.run).map(w => w.wizard);
    const myWizards = (wizards.my || []).filter(w => w.run).map(w => w.wizard);
    const addWizards = (root: RootMenu) => {
      if (restrictedAccess) {
        return;
      }
      let wizardMenu: Menu;
      switch (root) {
        case RootMenu.BANKING:
          wizardMenu = Menu.RUN_WIZARD_BANKING;
          break;
        case RootMenu.MARKETPLACE:
          wizardMenu = Menu.RUN_WIZARD_MARKETPLACE;
          break;
        case RootMenu.PERSONAL:
          wizardMenu = Menu.RUN_WIZARD_PERSONAL;
          break;
        default:
          // Invalid root menu for wizards
          return;
      }

      const doAddWizards = (path: string, ws: Wizard[]) => {
        for (const w of ws) {
          const activeMenu = new ActiveMenu(wizardMenu, { wizard: w });
          const icon = this.wizardHelper.icon(w);
          add(activeMenu, `/wizards/${path}/${ApiHelper.internalNameOrId(w)}`, icon, w.label);
        }
      };

      // Add both system and my wizards
      doAddWizards('system', systemWizards.filter(w => this.adminMenuMatches(root, w.adminMenu)));
      doAddWizards('user/self', myWizards.filter(w => this.userMenuMatches(root, w.userMenu)));
    };

    // Lambda that adds all record types the given root menu entry
    const systemRecords = records.system || [];
    const userRecords = records.userManagement || [];
    const myRecords = records.user || [];
    const addRecords = (root: RootMenu) => {
      if (restrictedAccess) {
        return;
      }
      const doAddRecords = (owner: string, perms: RecordPermissions[]) => {
        for (const permission of perms) {
          const type = permission.type;
          const activeMenu = this.activeMenuForRecordType(owner === RecordHelperService.GENERAL_SEARCH, type);
          const icon = this.recordHelper.icon(type);
          const path = this.recordHelper.resolvePath(permission, owner);
          const label = type.layout === RecordLayoutEnum.SINGLE ? type.name : type.pluralName;
          add(activeMenu, path, icon, label);
        }
      };

      // Add each kind of records
      doAddRecords('system', systemRecords.filter(p => this.adminMenuMatches(root, p.type.adminMenu)));
      if ((isBroker && root === RootMenu.BROKERING) || (isAdmin && root === RootMenu.MARKETPLACE)) {
        doAddRecords(RecordHelperService.GENERAL_SEARCH, userRecords);
      }
      doAddRecords('self', myRecords.filter(p => this.userMenuMatches(root, p.type.userMenu)));
    };
    // Add the submenus
    if (restrictedAccess) {/*  */
      // No menus in restricted access
    } else if (user == null) {
      // Guest
      if (data.hasHomePage) {
        add(Menu.HOME, '/', SvgIcon.HouseDoor2, home.label);
      }
      if (users.search || users.map) {
        add(Menu.PUBLIC_DIRECTORY, '/users/search', SvgIcon.People, publicDirectory.label);
      }
      if (marketplace?.userSimple?.view || marketplace?.userWebshop?.view) {
        add(Menu.PUBLIC_MARKETPLACE, '/marketplace/search', SvgIcon.Shop2, publicMarketplace.label);
      }
      const locales = data.dataForUi.allowedLocales || [];
      if (locales.length > 1) {
        // Add a language switcher
        const languages = addRoot(RootMenu.LANGUAGE, SvgIcon.ChatText, this.i18n.menu.language);
        locales.forEach(locale => {
          const switchLocale = add(Menu.LANGUAGE, '', SvgIcon.Globe, locale.name);
          switchLocale.locale = locale;
        });
        languages.dropdown = true;
      }
      const registrationGroups = data.dataForUi.publicRegistrationGroups || [];
      if (registrationGroups.length > 0) {
        add(Menu.PUBLIC_REGISTRATION, '/users/registration', SvgIcon.PersonPlus, register.label);
      }
      const externalLoginUrl = this.dataForFrontendHolder.dataForFrontend.externalLoginUrl;
      add(Menu.LOGIN, externalLoginUrl || '/login', SvgIcon.Login2, login.label);
    } else {
      // Logged user
      add(Menu.DASHBOARD, '/', SvgIcon.Grid2, dashboard.label);

      const banking = permissions.banking || {};
      const contacts = permissions.contacts || {};
      const operators = permissions.operators || {};
      const imports = permissions.imports || {};

      // Banking
      const owner = isAdmin ? ApiHelper.SYSTEM : ApiHelper.SELF;
      const accountTypes = this.bankingHelper.ownerAccountTypes();
      if (accountTypes.length >= ApiHelper.MIN_ACCOUNTS_FOR_SUMMARY) {
        add(Menu.ACCOUNTS_SUMMARY, `/banking/${owner}/accounts-summary`, SvgIcon.Wallet2, this.i18n.menu.bankingAccountsSummary);
      } else if (accountTypes.length > 0) {
        for (const type of accountTypes) {
          const activeMenu = new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: type });
          add(activeMenu, `/banking/${owner}/account/${ApiHelper.internalNameOrId(type)}`, SvgIcon.Wallet2, type.name);
        }
      }
      if (banking.accountVisibilitySettings) {
        add(Menu.ACCOUNT_VISIBILTIY, `/banking/${owner}/account-visibility`, SvgIcon.Eye, this.i18n.menu.bankingAccountVisibility);
      }
      const payments = banking.payments || {};
      if (payments.user) {
        add(Menu.PAYMENT_TO_USER, `/banking/${owner}/payment`, SvgIcon.Wallet2ArrowRight, this.i18n.menu.bankingPayUser);
      }
      if (payments.self) {
        add(Menu.PAYMENT_TO_SELF, `/banking/${owner}/payment/self`, SvgIcon.Wallet2ArrowRight, this.i18n.menu.bankingPaySelf);
      }
      if (payments.system) {
        add(Menu.PAYMENT_TO_SYSTEM, `/banking/${owner}/payment/system`, SvgIcon.Wallet2ArrowRight, this.i18n.menu.bankingPaySystem);
      }
      const tickets = banking.tickets || {};
      if (tickets.create) {
        add(Menu.RECEIVE_QR_PAYMENT, `/banking/qr`, SvgIcon.QrCodeScan, this.i18n.menu.bankingReceiveQrPayment);
      }
      if (payments.pos) {
        add(Menu.POS, `/banking/pos`, SvgIcon.CreditCard, this.i18n.menu.bankingPos);
      }
      if (banking.scheduledPayments?.view) {
        add(Menu.SCHEDULED_PAYMENTS, `/banking/${owner}/installments`,
          SvgIcon.CalendarEvent, this.i18n.menu.bankingScheduledPayments);
      }
      if (banking.paymentRequests?.view) {
        add(Menu.PAYMENT_REQUESTS, `/banking/${owner}/payment-requests`, SvgIcon.Wallet2ArrowLeft, this.i18n.menu.bankingPaymentRequests);
      }
      if (banking.externalPayments?.view) {
        add(Menu.EXTERNAL_PAYMENTS, `/banking/${owner}/external-payments`, SvgIcon.Wallet2ArrowUpRight,
          this.i18n.menu.bankingExternalPayments);
      }
      if (banking.tickets?.view) {
        add(Menu.TICKETS, `/banking/${owner}/tickets`, SvgIcon.Wallet2Check, this.i18n.menu.bankingTickets);
      }

      const authorizations = (banking.authorizations || {});
      if (authorizations.authorize) {
        add(Menu.PENDING_MY_AUTHORIZATION, `/banking/pending-my-authorization`,
          SvgIcon.Wallet2Check, this.i18n.menu.bankingPendingMyAuth);
      }
      if (authorizations.view) {
        if (isAdmin && banking.searchGeneralAuthorizedPayments) {
          add(Menu.AUTHORIZED_PAYMENTS_OVERVIEW, `/banking/authorized-payments`,
            SvgIcon.Wallet2Check, this.i18n.menu.bankingAuthorizations);
        } else {
          add(Menu.AUTHORIZED_PAYMENTS, `/banking/${owner}/authorized-payments`,
            SvgIcon.Wallet2Check, this.i18n.menu.bankingAuthorizations);
        }
      }
      if (banking.searchGeneralTransfers) {
        add(Menu.ADMIN_TRANSFERS_OVERVIEW, `/banking/transfers-overview`, SvgIcon.ArrowLeftRight, this.i18n.menu.bankingTransfersOverview);
      }

      if (banking.scheduledPayments?.view && banking.searchGeneralScheduledPayments) {
        add(Menu.SCHEDULED_PAYMENTS_OVERVIEW, `/banking/installments-overview`,
          SvgIcon.CalendarEvent, this.i18n.menu.bankingScheduledPaymentsOverview);
      }

      if (isAdmin && banking.searchGeneralPaymentRequests) {
        add(Menu.PAYMENT_REQUESTS_OVERVIEW, `/banking/payment-requests`,
          SvgIcon.Wallet2ArrowLeft, this.i18n.menu.bankingPaymentRequestsOverview);
      }

      if (isAdmin && banking.searchGeneralExternalPayments) {
        add(Menu.EXTERNAL_PAYMENTS_OVERVIEW, `/banking/external-payments`,
          SvgIcon.Wallet2ArrowUpRight, this.i18n.menu.bankingExternalPaymentsOverview);
      }

      if (banking.searchUsersWithBalances) {
        add(Menu.USER_BALANCES_OVERVIEW, `/banking/user-balances-overview`,
          SvgIcon.Wallet2Person, this.i18n.menu.bankingUserBalancesOverview);
      }

      if (data.voucherBuyingMenu == UserMenuEnum.BANKING && vouchers.viewVouchers) {
        add(Menu.SEARCH_MY_VOUCHERS_BANKING, '/banking/self/vouchers', SvgIcon.Ticket, this.i18n.menu.bankingMyVouchers);
      }

      if (vouchers.viewTransactions) {
        const voucherTransactionsMenuLabel = data.topUpEnabled ? this.i18n.menu.bankingVoucherTransactions :
          this.i18n.menu.bankingVoucherTransactionsRedeems;

        add(Menu.VOUCHER_TRANSACTIONS, '/banking/' + ApiHelper.SELF + '/voucher-transactions',
          SvgIcon.TicketDetailed, voucherTransactionsMenuLabel);
      }

      if (vouchers.view) {
        add(Menu.SEARCH_VOUCHERS, '/banking/vouchers',
          SvgIcon.Ticket, this.i18n.menu.bankingVouchers);
      }

      if (banking.searchGeneralBalanceLimits) {
        add(Menu.ACCOUNT_BALANCE_LIMITS_OVERVIEW, '/banking/account-balance-limits-overview',
          SvgIcon.ArrowDownUp, this.i18n.menu.bankingAccountBalanceLimits);
      }

      if (banking.searchGeneralPaymentLimits) {
        add(Menu.ACCOUNT_PAYMENT_LIMITS_OVERVIEW, '/banking/account-payment-limits-overview',
          SvgIcon.ArrowDownUp, this.i18n.menu.bankingAccountPaymentLimits);
      }

      if (isAdmin && imports.visibleKinds?.includes(ImportedFileKind.PAYMENTS)) {
        add(Menu.PAYMENT_IMPORTS, '/imports/system/payments/files',
          SvgIcon.ArrowUpCircle, this.i18n.menu.bankingImportedPayments);
      } else if (!isAdmin && imports.visibleKinds?.includes(ImportedFileKind.USER_PAYMENTS)) {
        add(Menu.PAYMENT_IMPORTS, '/imports/self/userPayments/files',
          SvgIcon.ArrowUpCircle, this.i18n.menu.bankingUserImportedPayments);
      }

      addRecords(RootMenu.BANKING);
      addOperations(RootMenu.BANKING);
      addWizards(RootMenu.BANKING);
      addContentPages(Menu.CONTENT_PAGE_BANKING);

      // Operators
      if (operators.enable) {
        add(Menu.MY_OPERATORS, '/users/self/operators', SvgIcon.PersonCircleOutline, this.i18n.menu.operatorsOperators);
        add(Menu.REGISTER_OPERATOR, '/users/self/operators/registration', SvgIcon.PersonPlus, this.i18n.menu.operatorsRegister);
        add(Menu.OPERATOR_GROUPS, '/users/self/operator-groups', SvgIcon.People, this.i18n.menu.operatorsGroups);
      }

      // Brokering
      if (isBroker) {
        add(Menu.MY_BROKERED_USERS, '/users/brokerings', SvgIcon.PersonSquareOutline, this.i18n.menu.brokeringUsers);
        if (marketplace.userSimple.view || marketplace.userWebshop.view) {
          add(Menu.BROKERED_USERS_ADS, '/marketplace/broker-search', SvgIcon.Basket, this.i18n.menu.brokeringAds);
        }
        if (users.registerAsBroker) {
          add(Menu.BROKER_REGISTRATION, '/users/registration', SvgIcon.PersonPlus, this.i18n.menu.brokeringRegister);
        }
        if (banking.searchGeneralTransfers) {
          add(Menu.BROKER_TRANSFERS_OVERVIEW, `/banking/transfers-overview`,
            SvgIcon.Wallet2ArrowLeftRight, this.i18n.menu.bankingTransfersOverview);
        }
        if (banking.searchGeneralAuthorizedPayments) {
          add(Menu.BROKER_AUTHORIZED_PAYMENTS_OVERVIEW, `/banking/authorized-payments`,
            SvgIcon.Wallet2Check, this.i18n.menu.bankingAuthorizations);
        }
        addRecords(RootMenu.BROKERING);
        addOperations(RootMenu.BROKERING);
        addWizards(RootMenu.BROKERING);
      }

      // Users
      if ((!data.dataForUi.hideUserSearchInMenu && users.search) || (!isAdmin && users.map && this.mapService.enabled)) {
        add(Menu.SEARCH_USERS, '/users/search', SvgIcon.People,
          isAdmin ? this.i18n.menu.marketplaceUserSearch : this.i18n.menu.marketplaceBusinessDirectory);
      }
      if (users.registerAsAdmin) {
        add(Menu.ADMIN_REGISTRATION, '/users/registration', SvgIcon.PersonPlus, this.i18n.menu.marketplaceRegister);
      }
      const sessions = permissions.sessions || {};
      if (sessions.view) {
        const menu = isBroker ? Menu.BROKER_CONNECTED_USERS : Menu.CONNECTED_USERS;
        add(menu, '/users/connected', SvgIcon.Login2, this.i18n.menu.marketplaceConnectedUsers);
      }
      const systemMessages = (permissions.messages || {}).system;
      if (systemMessages?.view) {
        add(Menu.SYSTEM_MESSAGES, '/users/messages/search', SvgIcon.Envelope, this.i18n.menu.marketplaceSystemMessages);
      }

      // Marketplace
      const alerts = permissions.alerts || {};
      if (alerts.view) {
        add(Menu.USER_ALERTS, '/users/alerts', SvgIcon.ExclamationDiamond, this.i18n.menu.marketplaceUserAlerts);
      }

      if (marketplace.userSimple.view || marketplace.userWebshop.view) {
        add(Menu.SEARCH_ADS, '/marketplace/search', SvgIcon.Basket, this.i18n.menu.marketplaceAdvertisements);
      }

      if (marketplace.userWebshop.purchase) {
        add(Menu.SHOPPING_CART, '/marketplace/shopping-cart', SvgIcon.Cart3, this.i18n.menu.shoppingCart);
      }
      if (marketplace.userWebshop.purchase) {
        add(Menu.PURCHASES, 'marketplace/self/purchases', SvgIcon.Bag2, this.i18n.menu.marketplaceMyPurchases);
      }

      if (marketplace.interests) {
        add(Menu.AD_INTERESTS, 'marketplace/self/ad-interests', SvgIcon.Star, this.i18n.menu.marketplaceAdInterests);
      }
      if (data.voucherBuyingMenu == UserMenuEnum.MARKETPLACE && vouchers.viewVouchers) {
        add(Menu.SEARCH_MY_VOUCHERS_MARKETPLACE, '/banking/self/vouchers', SvgIcon.Ticket, this.i18n.menu.bankingMyVouchers);
      }

      const simple = marketplace.mySimple || {};
      if (simple.enable) {
        add(Menu.SEARCH_USER_ADS, 'marketplace/self/simple/list', SvgIcon.Basket, this.i18n.menu.marketplaceMyAdvertisements);
      }
      const webshop = marketplace.myWebshop || {};
      if (webshop.enable) {
        add(Menu.SEARCH_USER_WEBSHOP, 'marketplace/self/webshop/list', SvgIcon.Basket, this.i18n.menu.marketplaceMyWebshop);
        add(Menu.SALES, 'marketplace/self/sales', SvgIcon.Receipt, this.i18n.menu.marketplaceMySales);
        add(Menu.DELIVERY_METHODS, 'marketplace/self/delivery-methods', SvgIcon.Truck, this.i18n.menu.marketplaceDeliveryMethods);
        add(Menu.WEBSHOP_SETTINGS, 'marketplace/self/webshop-settings/edit', SvgIcon.Gear, this.i18n.menu.marketplaceWebshopSettings);
      }

      if (simple.questions || webshop.questions) {
        add(Menu.UNANSWERED_QUESTIONS, 'marketplace/unanswered-questions',
          SvgIcon.ChatLeft, this.i18n.menu.marketplaceUnansweredQuestions);
      }
      if (permissions.invite?.send) {
        add(Menu.INVITE, '/personal/invite', SvgIcon.EnvelopeOpen, this.i18n.menu.marketplaceInviteUsers);
      }

      addRecords(RootMenu.MARKETPLACE);
      addOperations(RootMenu.MARKETPLACE);
      addWizards(RootMenu.MARKETPLACE);
      addContentPages(Menu.CONTENT_PAGE_MARKETPLACE);

      if (isAdmin) {
        // For admins, show the marketplace menu as users
        marketplaceRoot.icon = SvgIcon.People;
        marketplaceRoot.label = this.i18n.menu.marketplaceUsers;
        marketplaceRoot.title = this.i18n.menu.marketplaceUsers;
      } else if (marketplaceRoot.entries.length === 1 && marketplaceRoot.entries[0].menu === Menu.SEARCH_USERS) {
        // As the search ads won't be visible, show as user directory instead
        marketplaceRoot.icon = SvgIcon.People;
        marketplaceRoot.label = publicDirectory.label;
        marketplaceRoot.title = publicDirectory.label;
      }
      if (isAdmin) {
        for (const token of permissions.tokens?.user) {
          const activeMenu = new ActiveMenu(Menu.USER_TOKENS, { tokenType: token.type });
          add(activeMenu, `/users/tokens/search/${token.type.id}`, SvgIcon.CreditCard, token.type.pluralName);
        }
      }
      // Personal
      const myProfile = permissions.myProfile || {};
      add(Menu.MY_PROFILE, '/users/self/profile', SvgIcon.Person, this.i18n.menu.personalViewProfile);
      if (myProfile.editProfile) {
        add(Menu.EDIT_MY_PROFILE, '/users/self/profile/edit', SvgIcon.PersonCheck, this.i18n.menu.personalEditProfile, [MenuType.SIDENAV]);
      }
      add(Menu.SETTINGS, '/personal/settings', SvgIcon.Gear, this.i18n.menu.personalSettings);
      if (contacts.enable) {
        add(Menu.CONTACTS, '/users/contacts', SvgIcon.Book, this.i18n.menu.personalContacts);
      }
      const totpEnabled = this.dataForFrontendHolder.auth?.totpEnabled;
      if ((permissions.passwords || {}).manage || totpEnabled) {
        let passwordsLabel: string;
        if (!(permissions.passwords || {}).manage && totpEnabled) {
          passwordsLabel = this.i18n.menu.personalTotp;
        } else if ((permissions.passwords.passwords || []).length === 1) {
          passwordsLabel = this.i18n.menu.personalPassword;
        } else {
          passwordsLabel = this.i18n.menu.personalPasswords;
        }
        add(Menu.PASSWORDS, '/users/self/passwords', SvgIcon.Key, passwordsLabel);
      }
      if ((permissions.identityProviders || {}).enabled) {
        add(Menu.IDENTITY_PROVIDERS, '/users/self/identity-providers', SvgIcon.PersonBadge, this.i18n.menu.personalIdentityProviders);
      }
      if ((permissions.agreements || {}).view) {
        add(Menu.AGREEMENTS, '/users/self/agreements', SvgIcon.UiChecks, this.i18n.menu.personalAgreements);
      }
      if (permissions.documents.viewIndividual || permissions.documents.viewShared?.length > 0) {
        add(Menu.MY_DOCUMENTS, '/users/documents', SvgIcon.FileEarmarkText, this.i18n.menu.personalDocuments);
      }
      for (const token of permissions.tokens?.my) {
        const activeMenu = new ActiveMenu(Menu.MY_TOKENS, { tokenType: token.type });
        add(activeMenu, `/users/self/tokens/${token.type.id}`, this.tokenHelper.icon(token.type), token.type.pluralName);
      }
      const myMessages = (permissions.messages || {}).my;
      if (myMessages?.view) {
        add(Menu.MESSAGES, '/users/messages/search', SvgIcon.Envelope, this.i18n.menu.personalMessages);
      }
      if ((permissions.notifications || {}).enable) {
        add(Menu.NOTIFICATIONS, '/personal/notifications', SvgIcon.Bell, this.i18n.menu.personalNotifications);
      }
      const myReferences = (permissions.references || {});
      if (myReferences.receive || myReferences.give) {
        add(Menu.REFERENCES, '/users/self/references/search', SvgIcon.Star, this.i18n.menu.personalReferences);
      }
      const myFeedbacks = (permissions.paymentFeedbacks || {});
      if (myFeedbacks.receive || myFeedbacks.give) {
        add(Menu.FEEDBACKS, '/users/self/feedbacks/search', SvgIcon.Award, this.i18n.menu.personalFeedbacks);
      }
      if (this.dataForFrontendHolder.dataForFrontend.canManageQuickAccess) {
        add(Menu.QUICK_ACCESS_SETTINGS, '/users/self/quick-access/settings', SvgIcon.Grid2, this.i18n.menu.personalQuickAccessSettings);
      }
      addRecords(RootMenu.PERSONAL);
      addOperations(RootMenu.PERSONAL);
      addWizards(RootMenu.PERSONAL);
      addContentPages(Menu.CONTENT_PAGE_PERSONAL);

      // Add the logout
      add(Menu.LOGOUT, null, SvgIcon.Logout2, logout.label, logout.showIn);
    }

    // Content pages in the content root menu
    const pagesInContent = addContentPages(Menu.CONTENT_PAGE_CONTENT);

    // For guests, content will always be dropdown.
    // For logged users, only if at least 1 content page with layout full is used
    content.dropdown = user == null || (pagesInContent || []).findIndex(p => p.layout === 'full') >= 0;

    // Populate the menu in the root declaration order
    const rootMenus: RootMenuEntry[] = [];
    for (const root of Object.values(RootMenu)) {
      const rootEntry = roots.get(root);
      if (rootEntry && rootEntry.entries.length > 0) {
        rootMenus.push(rootEntry);
      }
    }
    return rootMenus;
  }

  resolveVoucherPermissions(vouchersPermissions: VouchersPermissions): ResolvedVouchersPermissions {
    const voucherPermissions = vouchersPermissions.vouchers || [];
    const view = !!voucherPermissions.find(config => config.view);
    const generate = !!voucherPermissions.find(config => config.generate);
    const viewVouchers = !!voucherPermissions.find(config => config.viewVouchers);
    const buy = !!voucherPermissions.find(config => config.buy);
    const send = !!voucherPermissions.find(config => config.send);
    const viewTransactions = !!voucherPermissions.find(config => config.viewTransactions);
    const redeem = !!voucherPermissions.find(config => config.redeem);
    const topUp = !!voucherPermissions.find(config => config.topUp);
    return { view, generate, viewVouchers, buy, send, viewTransactions, redeem, topUp };
  }

}
