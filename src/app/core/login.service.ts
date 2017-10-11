import { MenuType } from '../shared/menu';
import { Injectable } from '@angular/core';
import { Auth, User } from "app/api/models";
import { RequestOptions } from "@angular/http";
import { AuthService } from "app/api/services/auth.service";
import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";
import { NotificationService } from "app/core/notification.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { ApiConfigurationService } from "app/core/api-configuration.service";
import { Router } from "@angular/router";
import { Menu, RootMenuEntry, MenuEntry, RootMenu } from 'app/shared/menu';
import { GeneralMessages } from 'app/messages/general-messages';
import { ApiHelper } from 'app/shared/api-helper';

/**
 * Service used to manage the login status
 */
@Injectable()
export class LoginService {
  private _auth: Auth;

  private onAuth: Subject<Auth> = new Subject();

  public redirectUrl: string;

  private _menu: RootMenuEntry[];

  constructor(
    private apiConfigurationService: ApiConfigurationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private errorHandlerService: ErrorHandlerService,
    private generalMessages: GeneralMessages,
    private router: Router) {
  }

  /**
   * Adds a new observer notified when the user logs-in (auth != null) or logs out (auth == null)
   */
  subscribeForAuth(next?: (value: Auth) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.onAuth.subscribe(next, error, complete);
  }

  /**
   * Returns the currently authenticated user
   */
  get user(): User {
    return this._auth == null ? null : this._auth.user;
  }

  /**
   * Returns the current authentication
   */
  get auth(): Auth {
    return this._auth;
  }

  /**
   * Sets the current authentication
   */
  set auth(auth: Auth) {
    this._auth = auth;
  }

  /**
   * Performs the login
   * @param principal The user principal
   * @param password The user password
   */
  login(principal: string, password): Promise<Auth> {
    // Setup the basic authentication for the login request
    this.apiConfigurationService.nextAsBasic(principal, password);
    // Then attempt to do the login
    return this.authService.login({
      fields: ApiHelper.excludedAuthFields
    })
      .then(response => {
        // Prepare the API configuration to pass the session token
        let auth = response.data;
        this._auth = auth;
        this._menu = null;
        this.apiConfigurationService.sessionToken = auth.sessionToken;
        this.onAuth.next(auth);
        return auth;
      });
  }

  /**
   * Directly clears the logged user state
   */
  clear(): void {
    this.redirectUrl = null;
    this._auth = null;
    this.apiConfigurationService.sessionToken = null;
    this.onAuth.next(null);
  }

  /**
   * Performs the logout
   */
  logout(): Promise<void> {
    this.redirectUrl = null;
    if (this._auth == null) {
      // No one logged in
      return Promise.resolve();
    }
    return this.authService.logout()
      .then(response => {
        this._auth = null;
        this._menu = null;
        this.apiConfigurationService.sessionToken = null;
        this.onAuth.next(null);
        this.router.navigateByUrl('/login');
        return null;
      });
  }

  /**
   * Returns the menu structure to be displayed in a specific menu
   */
  menu(type: MenuType): RootMenuEntry[] {
    let roots: RootMenuEntry[] = [];
    for (let root of this.fullMenu) {
      if (root.showIn != null && !root.showIn.includes(type)) {
        // This entire root entry is not available for this menu type
        continue;
      }
      // Make a copy, because we don't know if there are filtered entries
      let copy = new RootMenuEntry(root.rootMenu, root.icon, root.label, root.title, root.showIn);
      for (let entry of root.entries) {
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
  }

  /**
   * Creates the full menu structure
   */
  private get fullMenu(): RootMenuEntry[] {
    if (this._menu != null) {
      // The menu is already calculated
      return this._menu;
    }

    let auth = this.auth || {};
    let permissions = auth.permissions

    // The root menu hierarchy
    let roots = new Map<RootMenu, RootMenuEntry>();
    let addRoot = (root: RootMenu, icon: string, label: string, title: string = null, showIn: MenuType[] = null) =>
      roots.set(root, new RootMenuEntry(root, icon, label, title, showIn));
    addRoot(RootMenu.LOGIN, 'lock', this.generalMessages.menuLogin());
    addRoot(RootMenu.HOME, 'home', this.generalMessages.menuHome());
    addRoot(RootMenu.BANKING, 'account_balance', this.generalMessages.menuBanking(), this.generalMessages.menuBankingTitle());
    addRoot(RootMenu.USERS, 'account_box', this.generalMessages.menuUsers(), this.generalMessages.menuBankingTitle());
    addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.generalMessages.menuMarketplace(), this.generalMessages.menuBankingTitle());
    addRoot(RootMenu.PERSONAL, 'account_box', this.generalMessages.menuPersonal(), this.generalMessages.menuPersonalProfile(), [MenuType.SIDENAV, MenuType.PERSONAL]);
    
    // The first-level menu entries
    let add = (menu: Menu, url: string, icon: string, label: string, showIn: MenuType[] = null) => {
      let root = roots.get(menu.root);
      root.entries.push(new MenuEntry(menu, url, icon, label, showIn));
    }
    if (auth.user == null) {
      // Guest
      add(Menu.LOGIN, '/login', 'lock', this.generalMessages.menuLogin());
    } else {
      let banking = permissions.banking || {};
      let users = permissions.users || {};
      let accounts = banking.accounts || [];

      // Banking
      if (accounts.length > 0) {
        for (let account of accounts) {
          let type = account.account.type;
          add(Menu.ACCOUNT, '/banking/account/' + ApiHelper.internalNameOrId(type),
            'account_balance', type.name, [MenuType.BAR, MenuType.SIDENAV]);
        }
      }
      let payments = banking.payments || {};
      if (payments.user || payments.system || payments.self) {
        add(Menu.PERFORM_PAYMENT, '/banking/payment', 'payment',
          this.generalMessages.menuBankingPayment());
      }
      if ((banking.scheduledPayments || {}).view) {
        add(Menu.SCHEDULED_PAYMENTS, '/banking/scheduled-payments', 'schedule', 
          this.generalMessages.menuBankingScheduledPayments());
      }
      if ((banking.recurringPayments || {}).view) {
        add(Menu.RECURRING_PAYMENTS, '/banking/recurring-payments', 'loop', 
          this.generalMessages.menuBankingRecurringPayments());
      }

      // Temporary, just to show other root menu entries
      add(Menu.SEARCH_USERS, '/users/search', 'account_box', null);
      add(Menu.SEARCH_MARKETPLACE, '/marketplace/search', 'shopping_cart', null);

      // Personal
      if (users.contacts) {
        add(Menu.CONTACTS, '/personal/contacts', 'contacts', 
          this.generalMessages.menuPersonalContacts());
      }
      if ((permissions.passwords || {}).manage) {
        add(Menu.PASSWORDS, '/personal/passwords', 'lock', 
          this.generalMessages.menuPersonalPasswords());
      }
      add(Menu.LOGOUT, null, 'exit_to_app', 
        this.generalMessages.menuPersonalLogout());
    }

    // Populate the menu in the root declaration order
    this._menu = [];
    for (let root of RootMenu.values()) {
      let rootEntry = roots.get(root);
      if (rootEntry && rootEntry.entries.length > 0) {
        this._menu.push(rootEntry);
      }
    }
    return this._menu;
  }
}