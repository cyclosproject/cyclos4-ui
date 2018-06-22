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

/** Contains the floating menus, that is, those which have no dedicated root menu, but do have a side menu */
export type FloatingMenu = 'editMyProfile';
export module FloatingMenu {
  export const EDIT_MY_PROFILE: FloatingMenu = 'editMyProfile';
  export function values(): FloatingMenu[] {
    return [EDIT_MY_PROFILE];
  }
}

/** Represents an available menu item */
export class Menu {
  constructor(
    public root: RootMenu,
    public floating: FloatingMenu = null
  ) { }
}
export module Menu {
  // Standalone
  export const HOME = new Menu(RootMenu.HOME);
  export const LOGIN = new Menu(RootMenu.LOGIN);
  export const REGISTRATION = new Menu(RootMenu.REGISTRATION);

  // Banking
  export const ACCOUNT_HISTORY = new Menu(RootMenu.BANKING);
  export const VIEW_TRANSFER = new Menu(RootMenu.BANKING);
  export const VIEW_TRANSACTION = new Menu(RootMenu.BANKING);
  export const PERFORM_PAYMENT = new Menu(RootMenu.BANKING);
  export const SCHEDULED_PAYMENTS = new Menu(RootMenu.BANKING);
  export const RECURRING_PAYMENTS = new Menu(RootMenu.BANKING);

  // Marketplace
  export const SEARCH_ADVERTISEMENTS = new Menu(RootMenu.MARKETPLACE);
  export const SEARCH_USERS = new Menu(RootMenu.MARKETPLACE);
  export const USER_PROFILE = new Menu(RootMenu.MARKETPLACE);

  // Personal
  export const MY_PROFILE = new Menu(RootMenu.PERSONAL);
  export const EDIT_MY_PROFILE = new Menu(RootMenu.PERSONAL, FloatingMenu.EDIT_MY_PROFILE);
  export const MY_PHONES = new Menu(RootMenu.PERSONAL, FloatingMenu.EDIT_MY_PROFILE);
  export const MY_ADDRESSES = new Menu(RootMenu.PERSONAL, FloatingMenu.EDIT_MY_PROFILE);
  export const MY_IMAGES = new Menu(RootMenu.PERSONAL, FloatingMenu.EDIT_MY_PROFILE);
  export const MY_CONTACT_INFOS = new Menu(RootMenu.PERSONAL, FloatingMenu.EDIT_MY_PROFILE);
  export const BACK_TO_PERSONAL = new Menu(RootMenu.PERSONAL, FloatingMenu.EDIT_MY_PROFILE);
  export const SETTINGS = new Menu(RootMenu.PERSONAL);
  export const CONTACTS = new Menu(RootMenu.PERSONAL);
  export const CONTACT_PROFILE = new Menu(RootMenu.PERSONAL);
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
