import { Injectable } from '@angular/core';
import { MenuType, Menu, RootMenuEntry, MenuEntry, RootMenu } from 'app/shared/menu';
import { LoginService } from 'app/core/login.service';
import { GeneralMessages } from 'app/messages/general-messages';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { User, Auth, AccountWithCurrency, AccountStatus, Permissions } from 'app/api/models';
import { AccountsService } from 'app/api/services';
import { PushNotificationsService } from 'app/core/push-notifications.service';

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu
 */
@Injectable()
export class MenuService {

  constructor(
    private login: LoginService,
    private pushNotifications: PushNotificationsService,
    private accountsService: AccountsService,
    private generalMessages: GeneralMessages
  ) {
    // Clear the status whenever the logged user changes
    this.login.subscribeForAuth(auth => {
      this._menu = null;
      if (auth) {
        this.fetchData();
      } else {
        this._accountStatuses.next(new Map());
      }
    });
    if (this.login.user) {
      // Fetch the data initially - there is a logged user
      this.fetchData();
    }
    this.pushNotifications.subscribeForAccountStatus(account => {
      const statuses = this._accountStatuses.value;
      statuses.set(account.id, account.status);
      this._accountStatuses.next(statuses);
    });
  }

  private _menu: RootMenuEntry[];
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
  menu(type: MenuType): RootMenuEntry[] {
    const roots: RootMenuEntry[] = [];
    for (const root of this.fullMenu) {
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
   * Creates the full menu structure
   */
  private get fullMenu(): RootMenuEntry[] {
    if (!this.login.authInitialized) {
      // Don't initialize the menu before the login service finishes fetching the initial auth
      return [];
    }
    if (this._menu != null) {
      // The menu is already calculated
      return this._menu;
    }

    const auth = this.login.auth || {};
    const permissions = auth.permissions;

    // The root menu hierarchy
    const roots = new Map<RootMenu, RootMenuEntry>();
    const addRoot = (root: RootMenu, icon: string, label: string, title: string = null, showIn: MenuType[] = null) =>
      roots.set(root, new RootMenuEntry(root, icon, label, title, showIn));
    addRoot(RootMenu.LOGIN, 'lock', this.generalMessages.menuLogin());
    addRoot(RootMenu.HOME, 'home', this.generalMessages.menuHome());
    addRoot(RootMenu.BANKING, 'account_balance', this.generalMessages.menuBanking(), this.generalMessages.menuBankingTitle());
    addRoot(RootMenu.USERS, 'account_box', this.generalMessages.menuUsers(), this.generalMessages.menuBankingTitle());
    addRoot(RootMenu.MARKETPLACE, 'shopping_cart', this.generalMessages.menuMarketplace(), this.generalMessages.menuBankingTitle());
    addRoot(RootMenu.PERSONAL, 'account_box', this.generalMessages.menuPersonal(),
      this.generalMessages.menuPersonalProfile(), [MenuType.SIDENAV, MenuType.PERSONAL]);

    // The first-level menu entries
    const add = (menu: Menu, url: string, icon: string, label: string, showIn: MenuType[] = null) => {
      const root = roots.get(menu.root);
      root.entries.push(new MenuEntry(menu, url, icon, label, showIn));
    };
    add(Menu.HOME, '/', 'home', this.generalMessages.menuHome());
    if (auth.user == null) {
      // Guest
      add(Menu.LOGIN, '/login', 'lock', this.generalMessages.menuLogin());
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
    for (const root of RootMenu.values()) {
      const rootEntry = roots.get(root);
      if (rootEntry && rootEntry.entries.length > 0) {
        this._menu.push(rootEntry);
      }
    }
    return this._menu;
  }
}
