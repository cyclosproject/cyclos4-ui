import { Injectable } from "@angular/core";
import { MenuType, Menu, RootMenuEntry, MenuEntry, RootMenu } from 'app/shared/menu';
import { LoginService } from "app/core/login.service";
import { GeneralMessages } from "app/messages/general-messages";
import { ApiHelper } from "app/shared/api-helper";
import { BehaviorSubject } from "rxjs";
import { User, Auth, AccountWithCurrency, AccountStatus, Permissions } from 'app/api/models';
import { AccountsService } from "app/api/services";
import * as moment from 'moment';

const SECONDS_BETWEEN_FETCH = 60;

/**
 * Holds shared data for the menu, plus logic regarding the currently visible menu 
 */
@Injectable()
export class MenuService {

  constructor(
    private login: LoginService,
    private accountsService: AccountsService,
    private generalMessages: GeneralMessages
  ) {
    // Clear the status whenever the logged user changes
    this.login.subscribeForAuth(auth => {
      this._menu = null;
      if (auth) {
        this.fetchData();
      }
    });
  }

  private _menu: RootMenuEntry[];
  private lastFetch: moment.Moment;
  private _accountStatuses = new BehaviorSubject<Map<String, AccountStatus>>(new Map());

  get accountStatuses(): BehaviorSubject<Map<String, AccountStatus>> {
    this.maybeFetchData();
    return this._accountStatuses;
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

  private maybeFetchData() {
    if (this.lastFetch == null 
      || moment().diff(this.lastFetch, 'seconds') > SECONDS_BETWEEN_FETCH) {
      this.fetchData();
    }
  }

  private fetchData() {
    this.lastFetch = moment();

    // Get the balance for each account
    this.accountsService.listAccountsByOwner({
      owner: ApiHelper.SELF, 
      fields: ['type.id', 'status.balance']
    })
      .then(response => {
        let accountStatuses = new Map<String, AccountStatus>();
        let accounts = response.data;
        for (let account of accounts) {
          accountStatuses.set(account.type.id, account.status);
        }
        this.accountStatuses.next(accountStatuses);
      });
  }
  

  /**
   * Creates the full menu structure
   */
  private get fullMenu(): RootMenuEntry[] {
    if (this._menu != null) {
      // The menu is already calculated
      return this._menu;
    }

    let auth = this.login.auth || {};
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
    add(Menu.HOME, '/', 'home', this.generalMessages.menuHome());
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