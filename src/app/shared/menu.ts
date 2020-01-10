import { AccountType, Operation, RecordType } from 'app/api/models';
import { empty } from 'app/shared/helper';

/** The types of menus in the application */
export enum MenuType {

  /** The sidenav shown on small devices */
  SIDENAV,

  /** The horizontal bar shown on medium+ devices when using a single top bar */
  TOP,

  /** The horizontal bar shown on medium+ devices when splitting the top and the menu bar */
  BAR,

  /** The second-level side menu shown on medium+ devices */
  SIDE
}

/** Contains the top-level (root) menus */
export type RootMenu =
  'dashboard' | 'banking' | 'operators' | 'brokering' | 'marketplace' |
  'home' | 'publicDirectory' | 'publicMarketplace' | 'content' |
  'personal' | 'registration' | 'login' | 'logout';
export module RootMenu {
  export const DASHBOARD: RootMenu = 'dashboard';
  export const BANKING: RootMenu = 'banking';
  export const OPERATORS: RootMenu = 'operators';
  export const BROKERING: RootMenu = 'brokering';
  export const MARKETPLACE: RootMenu = 'marketplace';
  export const HOME: RootMenu = 'home';
  export const PUBLIC_DIRECTORY: RootMenu = 'publicDirectory';
  export const PUBLIC_MARKETPLACE: RootMenu = 'publicMarketplace';
  export const CONTENT: RootMenu = 'content';
  export const PERSONAL: RootMenu = 'personal';
  export const REGISTRATION: RootMenu = 'registration';
  export const LOGIN: RootMenu = 'login';
  export const LOGOUT: RootMenu = 'logout';
  export function values(): RootMenu[] {
    return [
      DASHBOARD, BANKING, OPERATORS, BROKERING, MARKETPLACE,
      HOME, PUBLIC_DIRECTORY, PUBLIC_MARKETPLACE,
      CONTENT, PERSONAL, REGISTRATION, LOGIN, LOGOUT
    ];
  }
}

/** Represents an available menu item */
export class Menu {
  constructor(
    public readonly root: RootMenu,
    public readonly name: string) {
  }

  toString() {
    return `${this.root}.${this.name}`;
  }

  equals(o: Menu) {
    return this.root === o.root && this.name === o.name;
  }
}
export module Menu {

  // Standalone
  export const HOME = new Menu(RootMenu.HOME, 'HOME');
  export const DASHBOARD = new Menu(RootMenu.DASHBOARD, 'DASHBOARD');
  export const PUBLIC_DIRECTORY = new Menu(RootMenu.PUBLIC_DIRECTORY, 'PUBLIC_DIRECTORY');
  export const PUBLIC_MARKETPLACE = new Menu(RootMenu.PUBLIC_MARKETPLACE, 'PUBLIC_MARKETPLACE');
  export const PUBLIC_REGISTRATION = new Menu(RootMenu.REGISTRATION, 'PUBLIC_REGISTRATION');
  export const LOGIN = new Menu(RootMenu.LOGIN, 'LOGIN');
  export const LOGOUT = new Menu(RootMenu.LOGOUT, 'LOGOUT');

  // Banking
  export const ACCOUNT_HISTORY = new Menu(RootMenu.BANKING, 'ACCOUNT_HISTORY');
  export const ADMIN_TRANSFERS_OVERVIEW = new Menu(RootMenu.BANKING, 'ADMIN_TRANSFERS_OVERVIEW');
  export const PAYMENT_TO_USER = new Menu(RootMenu.BANKING, 'PAYMENT_TO_USER');
  export const PAYMENT_TO_SELF = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SELF');
  export const PAYMENT_TO_SYSTEM = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SYSTEM');
  export const POS = new Menu(RootMenu.BANKING, 'POS');
  export const SCHEDULED_PAYMENTS = new Menu(RootMenu.BANKING, 'SCHEDULED_PAYMENTS');
  export const AUTHORIZED_PAYMENTS = new Menu(RootMenu.BANKING, 'AUTHORIZED_PAYMENTS');
  export const REDEEM_VOUCHER = new Menu(RootMenu.BANKING, 'REDEEM_VOUCHER');
  export const SEARCH_REDEEMED = new Menu(RootMenu.BANKING, 'SEARCH_REDEEMED');
  export const SEARCH_VOUCHERS = new Menu(RootMenu.BANKING, 'SEARCH_VOUCHERS');

  // Users / Marketplace
  export const SEARCH_USERS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_USERS');
  export const SEARCH_ADS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_ADS');
  export const SEARCH_USER_ADS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_USER_ADS');
  export const PURCHASES = new Menu(RootMenu.MARKETPLACE, 'PURCHASES');
  export const SEARCH_USER_WEBSHOP = new Menu(RootMenu.MARKETPLACE, 'SEARCH_USER_WEBSHOP');
  export const SALES = new Menu(RootMenu.MARKETPLACE, 'SALES');
  export const DELIVERY_METHODS = new Menu(RootMenu.MARKETPLACE, 'DELIVERY_METHODS');
  export const CONNECTED_USERS = new Menu(RootMenu.MARKETPLACE, 'CONNECTED_USERS');
  export const ADMIN_REGISTRATION = new Menu(RootMenu.MARKETPLACE, 'ADMIN_REGISTRATION');
  export const USER_ALERTS = new Menu(RootMenu.MARKETPLACE, 'USER_ALERTS');
  export const SHOPPING_CART = new Menu(RootMenu.MARKETPLACE, 'SHOPPING_CART');

  export const VIEW_AD = new Menu(RootMenu.MARKETPLACE, 'VIEW_AD');

  export const BUY_VOUCHER = new Menu(RootMenu.MARKETPLACE, 'BUY_VOUCHER');
  export const SEARCH_BOUGHT_VOUCHERS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_BOUGHT_VOUCHERS');

  // Operators
  export const MY_OPERATORS = new Menu(RootMenu.OPERATORS, 'MY_OPERATORS');
  export const REGISTER_OPERATOR = new Menu(RootMenu.OPERATORS, 'REGISTER_OPERATOR');
  export const OPERATOR_GROUPS = new Menu(RootMenu.OPERATORS, 'OPERATOR_GROUPS');

  // Brokering
  export const MY_BROKERED_USERS = new Menu(RootMenu.BROKERING, 'MY_BROKERED_USERS');
  export const BROKER_REGISTRATION = new Menu(RootMenu.BROKERING, 'BROKER_REGISTRATION');
  export const BROKER_TRANSFERS_OVERVIEW = new Menu(RootMenu.BROKERING, 'BROKER_TRANSFERS_OVERVIEW');

  // Personal
  export const MY_PROFILE = new Menu(RootMenu.PERSONAL, 'MY_PROFILE');
  export const EDIT_MY_PROFILE = new Menu(RootMenu.PERSONAL, 'EDIT_MY_PROFILE');
  export const CONTACTS = new Menu(RootMenu.PERSONAL, 'CONTACTS');
  export const PASSWORDS = new Menu(RootMenu.PERSONAL, 'PASSWORDS');
  export const IDENTITY_PROVIDERS = new Menu(RootMenu.PERSONAL, 'IDENTITY_PROVIDERS');
  export const NOTIFICATIONS = new Menu(RootMenu.PERSONAL, 'NOTIFICATIONS');
  export const NOTIFICATIONS_SETTINGS = new Menu(RootMenu.PERSONAL, 'NOTIFICATIONS_SETTINGS');
  export const SETTINGS = new Menu(RootMenu.PERSONAL, 'SETTINGS');

  // Custom operations (one per root menu in owner, also one per operation container)
  export const RUN_OPERATION_BANKING = new Menu(RootMenu.BANKING, 'RUN_OPERATION_BANKING');
  export const RUN_OPERATION_MARKETPLACE = new Menu(RootMenu.MARKETPLACE, 'RUN_OPERATION_MARKETPLACE');
  export const RUN_OPERATION_PERSONAL = new Menu(RootMenu.PERSONAL, 'RUN_OPERATION_PERSONAL');
  export const RUN_USER_OPERATION = new Menu(RootMenu.MARKETPLACE, 'RUN_USER_OPERATION');
  export const RUN_MARKETPLACE_OPERATION = new Menu(RootMenu.MARKETPLACE, 'RUN_MARKETPLACE_OPERATION');
  export const RUN_RECORD_OPERATION = new Menu(RootMenu.PERSONAL, 'RUN_RECORD_OPERATION');
  export const RUN_TRANSFER_OPERATION = new Menu(RootMenu.BANKING, 'RUN_TRANSFER_OPERATION');
  export const RUN_ACTION_OPERATION = new Menu(RootMenu.BANKING, 'RUN_ACTION_OPERATION');

  // Records
  export const SEARCH_USER_RECORDS = new Menu(RootMenu.PERSONAL, 'SEARCH_USER_RECORDS');
  export const SEARCH_SYSTEM_RECORDS = new Menu(RootMenu.CONTENT, 'SEARCH_SYSTEM_RECORDS');
  export const SEARCH_ADMIN_RECORDS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_ADMIN_RECORDS');
  export const SEARCH_BROKER_RECORDS = new Menu(RootMenu.BROKERING, 'SEARCH_BROKER_RECORDS');

  // Content (one per root menu)
  export const CONTENT_PAGE_BANKING = new Menu(RootMenu.BANKING, 'CONTENT_PAGE_BANKING');
  export const CONTENT_PAGE_MARKETPLACE = new Menu(RootMenu.MARKETPLACE, 'CONTENT_PAGE_MARKETPLACE');
  export const CONTENT_PAGE_PERSONAL = new Menu(RootMenu.PERSONAL, 'CONTENT_PAGE_PERSONAL');
  export const CONTENT_PAGE_CONTENT = new Menu(RootMenu.CONTENT, 'CONTENT_PAGE_CONTENT');

  /**
   * Returns the various `Menu` that represents content pages in distinct root menus
   */
  export function contentPages(): Menu[] {
    return [CONTENT_PAGE_BANKING, CONTENT_PAGE_MARKETPLACE, CONTENT_PAGE_PERSONAL, CONTENT_PAGE_CONTENT];
  }
}

/**
 * The entries to show in the side menu
 */
export class SideMenuEntries {
  constructor(
    public title: string,
    public icon: string,
    public entries: MenuEntry[]
  ) {
  }
}

/** Base class for a resolved menu entry */
export abstract class BaseMenuEntry {
  constructor(
    public icon: string,
    public label: string,
    public showIn: MenuType[]
  ) { }
}
/** Resolved root menu entry */
export class RootMenuEntry extends BaseMenuEntry {
  constructor(
    public rootMenu: RootMenu,
    icon: string,
    label: string,
    public title: string = null,
    showIn: MenuType[] = null,
    public dropdown = false
  ) {
    super(icon, label, showIn);
    if (this.title == null) {
      this.title = this.label;
    }
  }

  /**
   * The entries in this menu
   */
  entries: MenuEntry[] = [];
}

/** Resolved menu entry */
export class MenuEntry extends BaseMenuEntry {
  public menu: Menu;
  public activeMenu: ActiveMenu;

  constructor(
    menu: Menu | ActiveMenu,
    private _url: string,
    icon: string,
    label: string,
    showIn: MenuType[] = null,
    private urlHandler: () => string,
    public menuData?: ActiveMenuData
  ) {
    super(icon, label, showIn);
    this.menu = menu instanceof ActiveMenu ? menu.menu : menu;
    this.activeMenu = menu instanceof ActiveMenu ? menu : new ActiveMenu(menu);
  }

  get url() {
    return this.urlHandler == null ? this._url : this.urlHandler();
  }
}


/**
 * Additional identifier for a dynamic active menu
 */
export interface ActiveMenuData {
  accountType?: AccountType;
  contentPage?: string;
  operation?: Operation;
  recordType?: RecordType;
}

/**
 * Contains information about the active menu
 */
export class ActiveMenu {
  constructor(
    public menu: Menu,
    public data?: ActiveMenuData
  ) {
    if (!menu) {
      throw new Error('null menu');
    }
  }

  matches(menu: MenuEntry | ActiveMenu | Menu): boolean {
    let other: ActiveMenu;
    if (menu instanceof MenuEntry) {
      other = menu.activeMenu;
    } else if (menu instanceof Menu) {
      other = new ActiveMenu(menu);
    } else if (menu) {
      other = menu;
    } else {
      // Null
      return false;
    }

    // First check the menu reference
    if (other == null || this.menu !== other.menu) {
      return false;
    }

    // At this point the menu matches. See if the data matches
    const data1 = this.data || {};
    const data2 = other.data || {};
    return empty(Object.keys(data1)) && empty(Object.keys(data2))
      || (data1.accountType && data2.accountType && data1.accountType.id === data2.accountType.id)
      || (data1.operation && data2.operation && data1.operation.id === data2.operation.id)
      || (data1.contentPage && data1.contentPage === data2.contentPage)
      || (data1.recordType && data2.recordType && data1.recordType.id === data2.recordType.id);
  }
}
