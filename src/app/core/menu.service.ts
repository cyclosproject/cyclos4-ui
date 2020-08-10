import { Injectable, Injector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  AccountType, Auth, DataForUi, Operation, RecordLayoutEnum, RecordPermissions, RoleEnum, VouchersPermissions, Wizard
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
import { WizardHelperService } from 'app/core/wizard-helper.service';

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
    private wizardHelper: WizardHelperService,
    private recordHelper: RecordHelperService
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
    const wizards = permissions.wizards || {};
    const vouchers = this.resolveVoucherPermissions(permissions.vouchers || {});
    const records = permissions.records || {};

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
    const add = (
      menu: Menu | ActiveMenu, url: string, icon: string, label: string,
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
      doAddOperations('system', systemOperations.filter(o => ApiHelper.adminMenuMatches(root, o.adminMenu)));
      doAddOperations('self', userOperations.filter(o => ApiHelper.userMenuMatches(root, o.userMenu)));
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
      doAddWizards('system', systemWizards.filter(w => ApiHelper.adminMenuMatches(root, w.adminMenu)));
      doAddWizards('user/self', myWizards.filter(w => ApiHelper.userMenuMatches(root, w.userMenu)));
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
          const activeMenu = this.recordHelper.activeMenuForRecordType(owner === RecordHelperService.GENERAL_SEARCH, type);
          const icon = this.recordHelper.icon(type);
          const path = this.recordHelper.resolvePath(permission, owner);
          const label = type.layout === RecordLayoutEnum.SINGLE ? type.name : type.pluralName;
          add(activeMenu, path, icon, label);
        }
      };

      // Add each kind of records
      doAddRecords('system', systemRecords.filter(p => ApiHelper.adminMenuMatches(root, p.type.adminMenu)));
      if ((role === RoleEnum.BROKER && root === RootMenu.BROKERING)
        || (role === RoleEnum.ADMINISTRATOR && root === RootMenu.MARKETPLACE)) {
        doAddRecords(RecordHelperService.GENERAL_SEARCH, userRecords);
      }
      doAddRecords('self', myRecords.filter(p => ApiHelper.userMenuMatches(root, p.type.userMenu)));
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
      const paymentRequests = banking.paymentRequests || {};
      if (paymentRequests.sendToUser) {
        add(Menu.PAYMENT_REQUEST_TO_USER, `/banking/${owner}/payment-request`, 'account_balance_wallet',
          this.i18n.menu.bankingRequestPaymentFromUser);
      }
      if (paymentRequests.sendToSystem) {
        add(Menu.PAYMENT_REQUEST_TO_SYSTEM, `/banking/${owner}/payment-request/system`, 'account_balance_wallet',
          this.i18n.menu.bankingRequestPaymentFromSystem);
      }
      const tickets = banking.tickets || {};
      if (tickets.create) {
        add(Menu.RECEIVE_QR_PAYMENT, `/banking/qr`, 'scan_qr_code', this.i18n.menu.bankingReceiveQrPayment);
      }
      if ((banking.scheduledPayments || {}).view) {
        add(Menu.SCHEDULED_PAYMENTS, `/banking/${owner}/installments`,
          'schedule', this.i18n.menu.bankingScheduledPayments);
      }
      if (paymentRequests.view) {
        add(Menu.PAYMENT_REQUESTS, `/banking/${owner}/payment-requests`, 'payment', this.i18n.menu.bankingPaymentRequests);
      }
      const authorizations = (banking.authorizations || {});
      if (authorizations.authorize) {
        add(Menu.PENDING_MY_AUTHORIZATION, `/banking/pending-my-authorization`,
          'assignment_late', this.i18n.menu.bankingPendingMyAuth);
      }
      if (authorizations.view) {
        if (role === RoleEnum.ADMINISTRATOR && banking.searchGeneralAuthorizedPayments) {
          add(Menu.AUTHORIZED_PAYMENTS_OVERVIEW, `/banking/authorized-payments`,
            'assignment_turned_in', this.i18n.menu.bankingAuthorizations);
        } else {
          add(Menu.AUTHORIZED_PAYMENTS, `/banking/${owner}/authorized-payments`,
            'assignment_turned_in', this.i18n.menu.bankingAuthorizations);
        }
      }
      if (banking.searchGeneralTransfers) {
        add(Menu.ADMIN_TRANSFERS_OVERVIEW, `/banking/transfers-overview`,
          'compare_arrows', this.i18n.menu.bankingTransfersOverview);
      }

      if ((banking.scheduledPayments || {}).view && banking.searchGeneralScheduledPayments) {
        add(Menu.SCHEDULED_PAYMENTS_OVERVIEW, `/banking/installments-overview`,
          'schedule', this.i18n.menu.bankingScheduledPaymentsOverview);
      }

      if (paymentRequests.view && role === RoleEnum.ADMINISTRATOR && banking.searchGeneralPaymentRequests) {
        add(Menu.PAYMENT_REQUESTS_OVERVIEW, `/banking/payment-requests`, 'payment', this.i18n.menu.bankingPaymentRequestsOverview);
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

      if (banking.searchGeneralBalanceLimits) {
        add(Menu.ACCOUNT_BALANCE_LIMITS_OVERVIEW, '/banking/account-balance-limits-overview', 'swap_vert',
          this.i18n.menu.bankingAccountBalanceLimits);
      }

      if (banking.searchGeneralPaymentLimits) {
        add(Menu.ACCOUNT_PAYMENT_LIMITS_OVERVIEW, '/banking/account-payment-limits-overview', 'swap_vert',
          this.i18n.menu.bankingAccountPaymentLimits);
      }

      addRecords(RootMenu.BANKING);
      addOperations(RootMenu.BANKING);
      addWizards(RootMenu.BANKING);
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
        if (banking.searchGeneralAuthorizedPayments) {
          add(Menu.BROKER_AUTHORIZED_PAYMENTS_OVERVIEW, `/banking/authorized-payments`,
            'assignment_turned_in', this.i18n.menu.bankingAuthorizations);
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
        add(Menu.WEBSHOP_SETTINGS, 'marketplace/self/webshop-settings/edit', 'store', this.i18n.menu.marketplaceWebshopSettings);
      }

      if (simple.questions || webshop.questions) {
        add(Menu.UNANSWERED_QUESTIONS, 'marketplace/unanswered-questions',
          'question_answer', this.i18n.menu.marketplaceUnansweredQuestions);
      }

      if (vouchers.buy && role !== RoleEnum.ADMINISTRATOR) {
        add(Menu.BUY_VOUCHER, '/banking/self/vouchers/buy', 'confirmation_number', this.i18n.menu.bankingBuyVouchers);
      }
      if (vouchers.viewBought) {
        add(Menu.SEARCH_BOUGHT_VOUCHERS, '/banking/self/vouchers/bought', 'local_play',
          this.i18n.menu.bankingBoughtVouchers);
      }
      addRecords(RootMenu.MARKETPLACE);
      addOperations(RootMenu.MARKETPLACE);
      addWizards(RootMenu.MARKETPLACE);
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
      if (auth.role === RoleEnum.ADMINISTRATOR) {
        for (const token of permissions.tokens?.user) {
          const activeMenu = new ActiveMenu(Menu.USER_TOKENS, { tokenType: token.type });
          add(activeMenu, `/users/tokens/search/${token.type.id}`, 'vpn_key', token.type.pluralName);
        }
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
      if ((permissions.agreements || {}).view) {
        add(Menu.AGREEMENTS, '/users/self/agreements', 'ballot', this.i18n.menu.personalAgreements);
      }
      if (permissions.documents.viewIndividual || permissions.documents.viewShared?.length > 0) {
        add(Menu.MY_DOCUMENTS, '/users/documents', 'library_books', this.i18n.menu.personalDocuments);
      }
      for (const token of permissions.tokens?.my) {
        const activeMenu = new ActiveMenu(Menu.MY_TOKENS, { tokenType: token.type });
        add(activeMenu, `/users/self/tokens/${token.type.id}`, 'vpn_key', token.type.pluralName);
      }
      if ((permissions.notifications || {}).enable) {
        add(Menu.NOTIFICATIONS, '/personal/notifications', 'notifications', this.i18n.menu.personalNotifications);
      }
      if ((permissions.notificationSettings || {}).enable) {
        add(Menu.NOTIFICATIONS_SETTINGS, `/users/${ApiHelper.SELF}/notification-settings`,
          'notifications_off', this.i18n.menu.personalNotificationSettings);
      }
      add(Menu.SETTINGS, '/personal/settings', 'settings', this.i18n.menu.personalSettings);
      if ((permissions.privacySettings || {}).view) {
        add(Menu.PRIVACY_SETTINGS, '/users/self/privacy-settings', 'settings', this.i18n.menu.personalPrivacySettings);
      }

      if ((permissions.references || {}).view) {
        add(Menu.REFERENCES, '/users/self/references/search', 'stars', this.i18n.menu.personalReferences);
      }
      addRecords(RootMenu.PERSONAL);
      addOperations(RootMenu.PERSONAL);
      addWizards(RootMenu.PERSONAL);
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
