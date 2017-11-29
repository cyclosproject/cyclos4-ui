import { Data } from '@angular/router';
import { Auth } from 'app/api/models';

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
export type RootMenu = 'home' | 'login' | 'personal' | 'banking' | 'users' | 'marketplace';
export module RootMenu {
  export const HOME: RootMenu = 'home';
  export const LOGIN: RootMenu = 'login';
  export const BANKING: RootMenu = 'banking';
  export const USERS: RootMenu = 'users';
  export const MARKETPLACE: RootMenu = 'marketplace';
  export const PERSONAL: RootMenu = 'personal';
  export function values(): RootMenu[] {
    return [HOME, LOGIN, BANKING, USERS, MARKETPLACE, PERSONAL];
  }
}

/** Represents an available menu item */
export class Menu {
  constructor(
    public root: RootMenu
  ) { }
}
export module Menu {
  // Standalone
  export const LOGIN = new Menu(RootMenu.LOGIN);
  export const HOME = new Menu(RootMenu.HOME);

  // Banking
  export const ACCOUNT_HISTORY = new Menu(RootMenu.BANKING);
  export const VIEW_TRANSFER = new Menu(RootMenu.BANKING);
  export const VIEW_TRANSACTION = new Menu(RootMenu.BANKING);
  export const PERFORM_PAYMENT = new Menu(RootMenu.BANKING);
  export const SCHEDULED_PAYMENTS = new Menu(RootMenu.BANKING);
  export const RECURRING_PAYMENTS = new Menu(RootMenu.BANKING);

  // Users
  export const SEARCH_USERS = new Menu(RootMenu.USERS);

  // Marketplace
  export const SEARCH_MARKETPLACE = new Menu(RootMenu.MARKETPLACE);

  // Personal
  export const CONTACTS = new Menu(RootMenu.PERSONAL);
  export const MY_PROFILE = new Menu(RootMenu.PERSONAL);
  export const PASSWORDS = new Menu(RootMenu.PERSONAL);
  export const LOGOUT = new Menu(RootMenu.PERSONAL);
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
  }
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
