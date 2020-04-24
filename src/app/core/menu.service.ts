import { Injectable, Injector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  AccountType, Auth, DataForUi, Operation, RecordLayoutEnum, RecordPermissions, RoleEnum, VouchersPermissions,
} from 'app/api/models';
import { Configuration } from 'app/configuration';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { LoginService } from 'app/core/login.service';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { RecordHelperService } from 'app/core/records-helper.service';
import { StateManager } from 'app/core/state-manager';
import { I18n } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { toFullUrl } from 'app/shared/helper';
import { ActiveMenu, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry, SideMenuEntries } from 'app/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

enum NavigateAction {
  Url,
  Logout,
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
  buy: boolean;
  redeem: boolean;
  generate: boolean;
  viewBought: boolean;
  viewRedeemed: boolean;
  view: boolean;
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
    private recordHelper: RecordHelperService,
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
    let url: string;

    if ((params.menu && params.menu.menu === Menu.LOGOUT)
      || params.entry && params.entry.menu === Menu.LOGOUT) {
      action = NavigateAction.Logout;
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
    } else if (url && url.startsWith('http')) {
      // An absolute URL
      const absoluteRoot = toFullUrl('/');
      if (url.startsWith(absoluteRoot)) {
        // Is an internal link
        url = url.substring(absoluteRoot.length);
        this.router.navigateByUrl(url, { replaceUrl: !!params.replaceUrl });
      } else {
        // Is an external link - all we can do is assign the location
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
    const vouchers = this.resolveVoucherPermissions(permissions.vouchers || {});
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
    addRoot(RootMenu.OPERATORS, 'supervisor_account', this.i18n.menu.operators);
    addRoot(RootMenu.BROKERING, 'assignment_ind', this.i18n.menu.brokering);
    const marketplaceRoot = addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.i18n.menu.marketplace);
    const content = addRoot(RootMenu.CONTENT, 'information', this.i18n.menu.content);
    addRoot(RootMenu.PERSONAL, 'account_box', this.i18n.menu.personal, null, [MenuType.SIDENAV, MenuType.BAR, MenuType.SIDE]);
    const register = addRoot(RootMenu.REGISTRATION, 'registration', this.i18n.menu.register, null, [MenuType.SIDENAV]);
    const login = addRoot(RootMenu.LOGIN, 'exit_to_app', this.i18n.menu.login, null, [MenuType.SIDENAV]);
    const logout = addRoot(RootMenu.LOGOUT, 'logout', this.i18n.menu.logout, null, []);

    // Lambda that adds a submenu to a root menu
    const add = (menu: Menu | ActiveMenu, url: string, icon: string, label: string, showIn: MenuType[] = null,
                 urlHandler: () => string = null): MenuEntry => {
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
        return p.rootMenu === menu.root && p.isVisible(auth, this.injector);
      });
      for (const page of pages) {
        const activeMenu = new ActiveMenu(menu, {
          contentPage: page.slug,
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

    // Lambda that adds records in the given root menu entry
    const addRecords = (menu: Menu, recordPermissions: RecordPermissions[], owner: string, my?: boolean) => {
      if ((!my || !auth.global) && recordPermissions.length > 0) {
        for (const permission of recordPermissions) {
          // If it's a general search exclude records not listed in menu
          if (owner === RecordHelperService.GENERAL_SEARCH && !permission.type.showInMenu) {
            continue;
          }
          const activeMenu = new ActiveMenu(menu, { recordType: permission.type });
          const pathFunction = () => this.recordHelper.resolvePath(
            permission, owner, owner === ApiHelper.SYSTEM);
          const path = pathFunction();
          if (path != null) {
            add(
              activeMenu,
              path,
              'library_books',
              permission.type.pluralName,
              null,
              // Calculate the path dinamically while the single form has not been saved for first time
              permission.type.layout === RecordLayoutEnum.SINGLE && !permission.singleRecordId ? pathFunction : null);
          }
        }
      }
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
      if (marketplace.userSimple.view || marketplace.userWebshop.view) {
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
      const owner = role === RoleEnum.ADMINISTRATOR ? ApiHelper.SYSTEM : ApiHelper.SELF;
      const accountTypes = this.bankingHelper.ownerAccountTypes();
      if (accountTypes.length > 0) {
        for (const type of accountTypes) {
          const activeMenu = new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType: type });
          const label = auth.role !== RoleEnum.ADMINISTRATOR && accountTypes.length === 1 ? this.i18n.menu.bankingAccount : type.name;
          add(activeMenu, `/banking/${owner}/account/${ApiHelper.internalNameOrId(type)}`, 'account_balance', label);
        }
      }
      const payments = banking.payments || {};
      if (payments.user) {
        add(Menu.PAYMENT_TO_USER, `/banking/${owner}/payment`, 'account_balance_wallet', this.i18n.menu.bankingPayUser);
      }
      if (payments.self) {
        add(Menu.PAYMENT_TO_SELF, `/banking/${owner}/payment/self`, 'account_balance_wallet', this.i18n.menu.bankingPaySelf);
      }
      if (payments.system) {
        add(Menu.PAYMENT_TO_SYSTEM, `/banking/${owner}/payment/system`, 'account_balance_wallet', this.i18n.menu.bankingPaySystem);
      }
      if (payments.pos) {
        add(Menu.POS, `/banking/pos`, 'payment', this.i18n.menu.bankingPos);
      }
      if ((banking.scheduledPayments || {}).view) {
        add(Menu.SCHEDULED_PAYMENTS, `/banking/${owner}/scheduled-payments`,
          'schedule', this.i18n.menu.bankingScheduledPayments);
      }
      if ((banking.authorizations || {}).view) {
        add(Menu.AUTHORIZED_PAYMENTS, `/banking/${owner}/authorized-payments`,
          'assignment_turned_in', this.i18n.menu.bankingAuthorizations);
      }
      if (banking.searchGeneralTransfers) {
        add(Menu.ADMIN_TRANSFERS_OVERVIEW, `/banking/transfers-overview`,
          'compare_arrows', this.i18n.menu.bankingTransfersOverview);
      }

      if (vouchers.viewRedeemed) {
        add(Menu.SEARCH_REDEEMED, '/banking/' + ApiHelper.SELF + '/vouchers/redeemed', 'search',
          this.i18n.menu.bankingRedeemedVouchers);
      }
      if (vouchers.redeem && role !== RoleEnum.ADMINISTRATOR) {
        add(Menu.REDEEM_VOUCHER, '/banking/' + ApiHelper.SELF + '/vouchers/redeem', 'payment', this.i18n.menu.bankingRedeemVoucher);
      }
      if (vouchers.view) {
        add(Menu.SEARCH_VOUCHERS, '/banking/vouchers', 'search', this.i18n.menu.bankingSearchVouchers);
      }
      addOperations(RootMenu.BANKING);
      addContentPages(Menu.CONTENT_PAGE_BANKING);

      // Operators
      if (operators.enable) {
        add(Menu.MY_OPERATORS, '/users/self/operators', 'supervisor_account', this.i18n.menu.operatorsOperators);
        add(Menu.REGISTER_OPERATOR, '/users/self/operators/registration', 'registration', this.i18n.menu.operatorsRegister);
        add(Menu.OPERATOR_GROUPS, '/users/self/operator-groups', 'supervised_user_circle', this.i18n.menu.operatorsGroups);
      }

      // Brokering
      if (auth.role === RoleEnum.BROKER) {
        add(Menu.MY_BROKERED_USERS, '/users/brokerings', 'supervisor_account', this.i18n.menu.brokeringUsers);
        if (users.registerAsBroker) {
          add(Menu.BROKER_REGISTRATION, '/users/registration', 'registration', this.i18n.menu.brokeringRegister);
        }
        if (banking.searchGeneralTransfers) {
          add(Menu.BROKER_TRANSFERS_OVERVIEW, `/banking/transfers-overview`,
            'compare_arrows', this.i18n.menu.bankingTransfersOverview);
        }
      }

      // Users
      if (users.search || users.map) {
        add(Menu.SEARCH_USERS, '/users/search', 'group', role === RoleEnum.ADMINISTRATOR
          ? this.i18n.menu.marketplaceUserSearch : this.i18n.menu.marketplaceBusinessDirectory);
      }
      if (users.registerAsAdmin) {
        add(Menu.ADMIN_REGISTRATION, '/users/registration', 'registration', this.i18n.menu.marketplaceRegister);
      }
      const sessions = permissions.sessions || {};
      if (sessions.view) {
        add(Menu.CONNECTED_USERS, '/users/connected', 'record_voice_over', this.i18n.menu.marketplaceConnectedUsers);
      }

      // Marketplace
      const alerts = permissions.alerts || {};
      if (alerts.view) {
        add(Menu.USER_ALERTS, '/users/alerts', 'notification_important', this.i18n.menu.marketplaceUserAlerts);
      }

      if (marketplace.userSimple.view || marketplace.userWebshop.view) {
        add(Menu.SEARCH_ADS, '/marketplace/search', 'shopping_cart', this.i18n.menu.marketplaceAdvertisements);
      }

      if (marketplace.userWebshop.purchase) {
        add(Menu.SHOPPING_CART, '/marketplace/shopping-cart', 'shopping_cart', this.i18n.menu.shoppingCart);
      }

      if (marketplace.interests) {
        add(Menu.AD_INTERESTS, 'marketplace/self/ad-interests', 'star', this.i18n.menu.marketplaceAdInterests);
      }

      const simple = marketplace.mySimple || {};
      if (simple.enable) {
        add(Menu.SEARCH_USER_ADS, 'marketplace/self/simple/list', 'shop', this.i18n.menu.marketplaceMyAdvertisements);
      }
      if (marketplace.userWebshop.purchase) {
        add(Menu.PURCHASES, 'marketplace/self/purchases', 'shop_two', this.i18n.menu.marketplaceMyPurchases);
      }
      const webshop = marketplace.myWebshop || {};
      if (webshop.enable) {
        add(Menu.SEARCH_USER_WEBSHOP, 'marketplace/self/webshop/list', 'shopping_basket', this.i18n.menu.marketplaceMyWebshop);
        add(Menu.SALES, 'marketplace/self/sales', 'local_offer', this.i18n.menu.marketplaceMySales);
        add(Menu.DELIVERY_METHODS, 'marketplace/self/delivery-methods', 'local_shipping', this.i18n.menu.marketplaceDeliveryMethods);
        add(Menu.WEBSHOP_SETTINGS, 'marketplace/self/webshop-settings/view', 'store', this.i18n.menu.marketplaceWebshopSettings);
      }

      if (marketplace.questions || webshop.manage) {
        add(Menu.UNANSWERED_QUESTIONS, 'marketplace/unanswered-questions',
          'question_answer', this.i18n.menu.marketplaceUnansweredQuestions);
      }

      if (vouchers.buy && role !== RoleEnum.ADMINISTRATOR) {
        add(Menu.BUY_VOUCHER, '/banking/self/vouchers/buy', 'shopping_cart', this.i18n.menu.bankingBuyVouchers);
      }
      if (vouchers.viewBought) {
        add(Menu.SEARCH_BOUGHT_VOUCHERS, '/banking/self/vouchers/bought', 'shopping_cart',
          this.i18n.menu.bankingBoughtVouchers);
      }
      addOperations(RootMenu.MARKETPLACE);
      addContentPages(Menu.CONTENT_PAGE_MARKETPLACE);

      if (role === RoleEnum.ADMINISTRATOR) {
        // For admins, show the marketplace menu as users
        marketplaceRoot.icon = 'supervisor_account';
        marketplaceRoot.label = this.i18n.menu.marketplaceUsers;
        marketplaceRoot.title = this.i18n.menu.marketplaceUsers;
      } else if (marketplaceRoot.entries.length === 1 && marketplaceRoot.entries[0].menu === Menu.SEARCH_USERS) {
        // As the search ads won't be visible, show as user directory instead
        marketplaceRoot.icon = publicDirectory.icon;
        marketplaceRoot.label = publicDirectory.label;
        marketplaceRoot.title = publicDirectory.label;
      }

      // Personal
      const myProfile = permissions.myProfile || {};
      add(Menu.MY_PROFILE, '/users/self/profile', 'account_box', this.i18n.menu.personalViewProfile);
      if (myProfile.editProfile) {
        add(Menu.EDIT_MY_PROFILE, '/users/self/profile/edit', 'account_box', this.i18n.menu.personalEditProfile, [MenuType.SIDENAV]);
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
        add(Menu.PASSWORDS, '/users/self/passwords', 'vpn_key', passwordsLabel);
      }
      if ((permissions.identityProviders || {}).enabled) {
        add(Menu.IDENTITY_PROVIDERS, '/users/self/identity-providers', 'perm_identity', this.i18n.menu.personalIdentityProviders);
      }

      // Records
      addRecords( // My
        Menu.SEARCH_USER_RECORDS,
        this.recordHelper.recordPermissions(),
        ApiHelper.SELF,
        true);
      addRecords( // User management (general search)
        role === RoleEnum.ADMINISTRATOR ? Menu.SEARCH_ADMIN_RECORDS : Menu.SEARCH_BROKER_RECORDS,
        this.recordHelper.recordPermissions(false, true),
        RecordHelperService.GENERAL_SEARCH);
      addRecords( // System
        Menu.SEARCH_SYSTEM_RECORDS,
        this.recordHelper.recordPermissions(true),
        ApiHelper.SYSTEM);

      if ((permissions.notifications || {}).enable) {
        add(Menu.NOTIFICATIONS, '/personal/notifications', 'notifications', this.i18n.menu.personalNotifications);
      }
      if ((permissions.notificationSettings || {}).enable) {
        add(Menu.NOTIFICATIONS_SETTINGS, `/users/${ApiHelper.SELF}/notification-settings`,
          'notifications_off', this.i18n.menu.personalNotificationSettings);
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

  private resolveVoucherPermissions(vouchersPermissions: VouchersPermissions): ResolvedVouchersPermissions {
    const voucherPermissions = vouchersPermissions.vouchers || [];
    const buy = !!voucherPermissions.find(config => config.buy);
    const redeem = !!voucherPermissions.find(config => config.redeem);
    const generate = !!voucherPermissions.find(config => config.generate);
    const viewBought = !!voucherPermissions.find(config => config.viewBought);
    const viewRedeemed = !!voucherPermissions.find(config => config.viewRedeemed);
    const view = !!voucherPermissions.find(config => config.view);
    return { buy, redeem, generate, viewBought, viewRedeemed, view };
  }

}
