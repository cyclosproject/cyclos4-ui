/** The types of menus in the application */
export enum MenuType {
  /** The sidenav shown on small devices */
  SIDENAV,
  /** The horizontal bar shown on medium+ devices */
  BAR,
  /** The second-level side menu shown on medium+ devices */
  SIDE,
  /** The popup personal menu shown on clicking the logged user avatar */
  PERSONAL
}

/** Contains the top-level (root) menus */
export type RootMenu = 'home' | 'login' | 'registration' | 'banking' | 'marketplace' | 'personal';
export module RootMenu {
  export const HOME: RootMenu = 'home';
  export const LOGIN: RootMenu = 'login';
  export const REGISTRATION: RootMenu = 'registration';
  export const BANKING: RootMenu = 'banking';
  export const MARKETPLACE: RootMenu = 'marketplace';
  export const PERSONAL: RootMenu = 'personal';
  export function values(): RootMenu[] {
    return [HOME, LOGIN, REGISTRATION, BANKING, MARKETPLACE, PERSONAL];
  }
}

/** Represents an available menu item */
export class Menu {
  constructor(
    public readonly root: RootMenu,
    public readonly name: string) { }
}
export module Menu {
  // Standalone
  export const HOME = new Menu(RootMenu.HOME, 'HOME');
  export const LOGIN = new Menu(RootMenu.LOGIN, 'LOGIN');
  export const REGISTRATION = new Menu(RootMenu.REGISTRATION, 'REGISTRATION');

  // Banking
  export const ACCOUNT_HISTORY = new Menu(RootMenu.BANKING, 'ACCOUNT_HISTORY');
  export const VIEW_TRANSFER = new Menu(RootMenu.BANKING, 'VIEW_TRANSFER');
  export const VIEW_TRANSACTION = new Menu(RootMenu.BANKING, 'VIEW_TRANSACTION');
  export const PAYMENT_TO_USER = new Menu(RootMenu.BANKING, 'PAYMENT_TO_USER');
  export const PAYMENT_TO_SELF = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SELF');
  export const PAYMENT_TO_SYSTEM = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SYSTEM');
  export const SCHEDULED_PAYMENTS = new Menu(RootMenu.BANKING, 'SCHEDULED_PAYMENTS');
  export const RECURRING_PAYMENTS = new Menu(RootMenu.BANKING, 'RECURRING_PAYMENTS');
  export const AUTHORIZED_PAYMENTS = new Menu(RootMenu.BANKING, 'AUTHORIZED_PAYMENTS');

  // Marketplace
  export const SEARCH_USERS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_USERS');
  export const USER_PROFILE = new Menu(RootMenu.MARKETPLACE, 'USER_PROFILE');
  export const SEARCH_ADS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_ADS');
  export const VIEW_AD = new Menu(RootMenu.MARKETPLACE, 'VIEW_AD');

  // Personal
  export const MY_PROFILE = new Menu(RootMenu.PERSONAL, 'MY_PROFILE');
  export const EDIT_MY_PROFILE = new Menu(RootMenu.PERSONAL, 'EDIT_MY_PROFILE');
  export const CONTACTS = new Menu(RootMenu.PERSONAL, 'CONTACTS');
  export const CONTACT_PROFILE = new Menu(RootMenu.PERSONAL, 'CONTACTS_PROFILE');
  export const PASSWORDS = new Menu(RootMenu.PERSONAL, 'PASSWORDS');
  export const LOGOUT = new Menu(RootMenu.PERSONAL, 'LOGOUT');
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
    showIn: MenuType[] = null
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
  constructor(
    public menu: Menu,
    public url: string,
    icon: string,
    label: string,
    showIn: MenuType[] = null
  ) {
    super(icon, label, showIn);
  }
}

/**
 * The entries to show in the side menu
 */
export class SideMenuEntries {
  constructor(
    public title: string,
    public entries: MenuEntry[]
  ) {
  }
}
