import { Injector } from '@angular/core';
import { Observable } from 'rxjs';

/** The types of menus in the application */
export enum MenuType {
  /** The sidenav shown on small devices */
  SIDENAV,
  /** The horizontal bar shown on medium+ devices */
  BAR,
  /** The second-level side menu shown on medium+ devices */
  SIDE
}

/** Contains the top-level (root) menus */
export type RootMenu =
  'dashboard' | 'banking' | 'marketplace' | 'personal' |
  'home' | 'publicDirectory' | 'publicMarketplace' |
  'content' | 'registration' | 'login';
export module RootMenu {
  export const DASHBOARD: RootMenu = 'dashboard';
  export const BANKING: RootMenu = 'banking';
  export const MARKETPLACE: RootMenu = 'marketplace';
  export const PERSONAL: RootMenu = 'personal';
  export const HOME: RootMenu = 'home';
  export const PUBLIC_DIRECTORY: RootMenu = 'publicDirectory';
  export const PUBLIC_MARKETPLACE: RootMenu = 'publicMarketplace';
  export const CONTENT: RootMenu = 'content';
  export const REGISTRATION: RootMenu = 'registration';
  export const LOGIN: RootMenu = 'login';
  export function values(): RootMenu[] {
    return [
      DASHBOARD, BANKING, MARKETPLACE, PERSONAL,
      HOME, PUBLIC_DIRECTORY, PUBLIC_MARKETPLACE,
      CONTENT, REGISTRATION, LOGIN
    ];
  }
}

/** Represents an available menu item */
export class Menu {
  constructor(
    public readonly root: RootMenu,
    public readonly name: string,
    public readonly menuVisible = true) { }
}
export module Menu {
  // Standalone
  export const HOME = new Menu(RootMenu.HOME, 'HOME', false);
  export const DASHBOARD = new Menu(RootMenu.DASHBOARD, 'DASHBOARD', false);
  export const PUBLIC_DIRECTORY = new Menu(RootMenu.PUBLIC_DIRECTORY, 'PUBLIC_DIRECTORY', false);
  export const PUBLIC_MARKETPLACE = new Menu(RootMenu.PUBLIC_MARKETPLACE, 'PUBLIC_MARKETPLACE', false);
  export const REGISTRATION = new Menu(RootMenu.REGISTRATION, 'REGISTRATION', false);
  export const LOGIN = new Menu(RootMenu.LOGIN, 'LOGIN', false);

  // Banking
  export const ACCOUNT_HISTORY = new Menu(RootMenu.BANKING, 'ACCOUNT_HISTORY');
  export const VIEW_TRANSFER = new Menu(RootMenu.BANKING, 'VIEW_TRANSFER');
  export const VIEW_TRANSACTION = new Menu(RootMenu.BANKING, 'VIEW_TRANSACTION');
  export const PAYMENT_TO_USER = new Menu(RootMenu.BANKING, 'PAYMENT_TO_USER');
  export const PAYMENT_TO_SELF = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SELF');
  export const PAYMENT_TO_SYSTEM = new Menu(RootMenu.BANKING, 'PAYMENT_TO_SYSTEM');
  export const SCHEDULED_PAYMENTS = new Menu(RootMenu.BANKING, 'SCHEDULED_PAYMENTS');
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
  export const LOGOUT = new Menu(RootMenu.PERSONAL, 'LOGOUT', false);

  // Content (one per root menu)
  export const CONTENT_PAGE_BANKING = new Menu(RootMenu.BANKING, 'CONTENT_PAGE_BANKING');
  export const CONTENT_PAGE_MARKETPLACE = new Menu(RootMenu.MARKETPLACE, 'CONTENT_PAGE_MARKETPLACE');
  export const CONTENT_PAGE_PERSONAL = new Menu(RootMenu.PERSONAL, 'CONTENT_PAGE_PERSONAL');
  export const CONTENT_PAGE_CONTENT = new Menu(RootMenu.CONTENT, 'CONTENT_PAGE_CONTENT');
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

/**
 * A dynamic menu condition
 */
export type ConditionalMenu = (injector: Injector) => Menu | Observable<Menu>;
