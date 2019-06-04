import { Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { isEqual } from 'lodash';
import { AccountType, Operation } from 'app/api/models';

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
  'dashboard' | 'banking' | 'operators' | 'marketplace' | 'home' |
  'publicDirectory' | 'publicMarketplace' | 'content' |
  'personal' | 'registration' | 'login' | 'logout';
export module RootMenu {
  export const DASHBOARD: RootMenu = 'dashboard';
  export const BANKING: RootMenu = 'banking';
  export const OPERATORS: RootMenu = 'operators';
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
      DASHBOARD, BANKING, OPERATORS, MARKETPLACE,
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
  export const REGISTRATION = new Menu(RootMenu.REGISTRATION, 'REGISTRATION');
  export const LOGIN = new Menu(RootMenu.LOGIN, 'LOGIN');
  export const LOGOUT = new Menu(RootMenu.LOGOUT, 'LOGOUT');

  // Banking
  export const ACCOUNT_HISTORY = new Menu(RootMenu.BANKING, 'ACCOUNT_HISTORY');
  export const PAYMENT_TO_USER = new Menu(RootMenu.BANKING, 'PAYMENT_TO_USER');
  export const PAYMENT_TO_SELF = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SELF');
  export const PAYMENT_TO_SYSTEM = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SYSTEM');
  export const SCHEDULED_PAYMENTS = new Menu(RootMenu.BANKING, 'SCHEDULED_PAYMENTS');
  export const AUTHORIZED_PAYMENTS = new Menu(RootMenu.BANKING, 'AUTHORIZED_PAYMENTS');

  // Marketplace
  export const SEARCH_USERS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_USERS');
  export const SEARCH_ADS = new Menu(RootMenu.MARKETPLACE, 'SEARCH_ADS');

  export const VIEW_AD = new Menu(RootMenu.MARKETPLACE, 'VIEW_AD');
  export const BUY_VOUCHER = new Menu(RootMenu.MARKETPLACE, 'BUY_VOUCHER');

  // Operators
  export const MY_OPERATORS = new Menu(RootMenu.OPERATORS, 'MY_OPERATORS');

  // Personal
  export const MY_PROFILE = new Menu(RootMenu.PERSONAL, 'MY_PROFILE');
  export const EDIT_MY_PROFILE = new Menu(RootMenu.PERSONAL, 'EDIT_MY_PROFILE');
  export const CONTACTS = new Menu(RootMenu.PERSONAL, 'CONTACTS');
  export const PASSWORDS = new Menu(RootMenu.PERSONAL, 'PASSWORDS');
  export const NOTIFICATIONS = new Menu(RootMenu.PERSONAL, 'NOTIFICATIONS');
  export const SETTINGS = new Menu(RootMenu.PERSONAL, 'SETTINGS');

  // Custom operations (one per root menu in owner, also one per operation container)
  export const RUN_OPERATION_BANKING = new Menu(RootMenu.BANKING, 'RUN_OPERATION_BANKING');
  export const RUN_OPERATION_MARKETPLACE = new Menu(RootMenu.MARKETPLACE, 'RUN_OPERATION_MARKETPLACE');
  export const RUN_OPERATION_PERSONAL = new Menu(RootMenu.PERSONAL, 'RUN_OPERATION_PERSONAL');
  export const RUN_USER_OPERATION = new Menu(RootMenu.MARKETPLACE, 'RUN_USER_OPERATION');
  export const RUN_MARKETPLACE_OPERATION = new Menu(RootMenu.MARKETPLACE, 'RUN_MARKETPLACE_OPERATION');
  export const RUN_TRANSFER_OPERATION = new Menu(RootMenu.BANKING, 'RUN_TRANSFER_OPERATION');
  export const RUN_ACTION_OPERATION = new Menu(RootMenu.BANKING, 'RUN_ACTION_OPERATION');

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
    public entries: MenuEntry[]
  ) {
  }
}

/**
 * A dynamic menu condition
 */
export type ConditionalMenu = (injector: Injector) => Menu | ActiveMenu | Observable<Menu | ActiveMenu>;

/**
 * Additional identifier for a dynamic active menu
 */
export interface ActiveMenuData {
  accountType?: AccountType;
  contentPage?: string;
  operation?: Operation;
}

/**
 * Contains information about the active menu
 */
export class ActiveMenu {
  constructor(
    public menu: Menu,
    public data?: ActiveMenuData
  ) {
  }

  matches(entry: MenuEntry): boolean {
    return isEqual(this, entry.activeMenu);
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
    public url: string,
    icon: string,
    label: string,
    showIn: MenuType[] = null,
    public menuData?: ActiveMenuData
  ) {
    super(icon, label, showIn);
    this.menu = menu instanceof ActiveMenu ? menu.menu : menu;
    this.activeMenu = menu instanceof ActiveMenu ? menu : new ActiveMenu(menu);
  }
}

