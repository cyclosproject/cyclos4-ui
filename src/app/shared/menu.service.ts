import { Injectable } from '@angular/core';
import { MenuType, Menu, RootMenuEntry, MenuEntry, RootMenu } from 'app/shared/menu';
import { LoginService } from 'app/core/login.service';
import { GeneralMessages } from 'app/messages/general-messages';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AccountStatus, Auth } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { RegistrationGroupsResolve } from '../registration-groups.resolve';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable()
export class MenuService {

  constructor(
    private login: LoginService,
    private pushNotifications: PushNotificationsService,
    private accountsService: AccountsService,
    private generalMessages: GeneralMessages,
    private registrationGroups: RegistrationGroupsResolve
  ) {
    // Clear the status whenever the logged user changes
    this._fullMenu = new BehaviorSubject<RootMenuEntry[]>([]);
    if (this.login.authInitialized) {
      this._fullMenu.next(this.buildFullMenu(this.login.auth));
      if (this.login.user) {
        // Fetch the data initially - there is a logged user
        this.fetchData();
      }
    }
    // Whenever the authenticated user changes, reload the menu
    this.login.subscribeForAuth(auth => {
      this._fullMenu.next(this.buildFullMenu(auth));
      if (auth != null && auth.user) {
        // Fetch the data initially - there is a logged user
        this.fetchData();
      }
    });
    // When the registration changes, fetch the menu as well
    this.registrationGroups.data.subscribe(groups => {
      this._fullMenu.next(this.buildFullMenu(this.login.auth));
    });
    this.pushNotifications.subscribeForAccountStatus(account => {
      const statuses = this._accountStatuses.value;
      statuses.set(account.id, account.status);
      this._accountStatuses.next(statuses);
    });
  }

  private _fullMenu: BehaviorSubject<RootMenuEntry[]>;
  private _accountStatuses = new BehaviorSubject<Map<String, AccountStatus>>(new Map());

  get accountStatuses(): BehaviorSubject<Map<String, AccountStatus>> {
    if (this._accountStatuses == null) {
      this.fetchData();
    }
    return this._accountStatuses;
  }

  /**
   * Returns the menu structure to be displayed in a specific menu
   */
  menu(type: MenuType): Observable<RootMenuEntry[]> {
    return this._fullMenu.pipe(
      map(fullRoots => {
        const roots: RootMenuEntry[] = [];
        for (const root of fullRoots) {
          if (root.showIn != null && !root.showIn.includes(type)) {
            // This entire root entry is not available for this menu type
            continue;
          }
          // Make a copy, because we don't know if there are filtered entries
          const copy = new RootMenuEntry(root.rootMenu, root.icon, root.label, root.title, root.showIn);
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
      })
    );
  }

  private fetchData() {
    // Get the balance for each account
    this.accountsService.listAccountsByOwner({
      owner: ApiHelper.SELF,
      fields: ['id', 'status.balance']
    })
      .subscribe(accounts => {
        const accountStatuses = new Map<String, AccountStatus>();
        for (const account of accounts) {
          accountStatuses.set(account.id, account.status);
        }
        this.accountStatuses.next(accountStatuses);
      });
  }


  /**
   * Build the full menu structure from the given authentication
   */
  private buildFullMenu(maybeNullAuth: Auth): RootMenuEntry[] {
    const auth = maybeNullAuth || {};
    const permissions = auth.permissions;
    const user = auth.user;

    const roots = new Map<RootMenu, RootMenuEntry>();
    // Lambda that adds a root menu
    const addRoot = (root: RootMenu, icon: string, label: string, title: string = null, showIn: MenuType[] = null) =>
      roots.set(root, new RootMenuEntry(root, icon, label, title, showIn));
    // Create the root menu entries
    addRoot(RootMenu.HOME,
      user == null ? 'home' : 'dashboard',
      user == null ? this.generalMessages.menuHome() : this.generalMessages.menuDashboard());
    addRoot(RootMenu.LOGIN, 'lock', this.generalMessages.menuLogin());
    addRoot(RootMenu.REGISTRATION, 'input', this.generalMessages.menuRegister());
    addRoot(RootMenu.BANKING, 'account_balance', this.generalMessages.menuBanking(), this.generalMessages.menuBankingTitle());
    addRoot(RootMenu.USERS, 'group', this.generalMessages.menuUsers(), this.generalMessages.menuUsersTitle());
    addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.generalMessages.menuMarketplace(), this.generalMessages.menuMarketplaceTitle());
    addRoot(RootMenu.PERSONAL, 'account_box', this.generalMessages.menuPersonal(), this.generalMessages.menuPersonalTitle());

    // Lambda that adds a submenu to a root menu
    const add = (menu: Menu, url: string, icon: string, label: string, showIn: MenuType[] = null) => {
      const root = roots.get(menu.root);
      root.entries.push(new MenuEntry(menu, url, icon, label, showIn));
    };
    // Add the submenus
    add(Menu.HOME, '/',
      user == null ? 'home' : 'dashboard',
      user == null ? this.generalMessages.menuHome() : this.generalMessages.menuDashboard());
    if (user == null) {
      // Guest
      const registrationGroups = this.registrationGroups.data.value || [];
      add(Menu.LOGIN, '/login', 'lock', this.generalMessages.menuLogin());
      if (registrationGroups.length > 0) {
        add(Menu.REGISTRATION, '/users/registration', 'input', this.generalMessages.menuRegister());
      }
    } else {
      const banking = permissions.banking || {};
      const users = permissions.users || {};
      const accounts = banking.accounts || [];

      // Banking
      if (accounts.length > 0) {
        for (const account of accounts) {
          const type = account.account.type;
          add(Menu.ACCOUNT_HISTORY, '/banking/account/' + ApiHelper.internalNameOrId(type),
            'account_balance', type.name, [MenuType.BAR, MenuType.SIDENAV]);
        }
      }
      const payments = banking.payments || {};
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

      // Users
      add(Menu.SEARCH_USERS, '/users/search', 'group',
        this.generalMessages.menuUsersSearch());

      // Temporary, just to show other root menu entries
      add(Menu.SEARCH_MARKETPLACE, '/marketplace/search', 'shopping_cart',
        this.generalMessages.menuMarketplaceSearch());

      // Personal
      add(Menu.MY_PROFILE, '/users/my-profile', 'account_box',
        this.generalMessages.menuPersonalProfile(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      add(Menu.SETTINGS, '/settings', 'settings',
        this.generalMessages.menuPersonalSettings(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      if (users.contacts) {
        add(Menu.CONTACTS, '/personal/contacts', 'contacts',
          this.generalMessages.menuPersonalContacts(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      if ((permissions.passwords || {}).manage) {
        add(Menu.PASSWORDS, '/personal/passwords', 'lock',
          this.generalMessages.menuPersonalPasswords(), [MenuType.BAR, MenuType.SIDENAV, MenuType.SIDE]);
      }
      add(Menu.LOGOUT, null, 'exit_to_app',
        this.generalMessages.menuPersonalLogout());
    }

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
}
