import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';
import { User, Auth, AccountWithCurrency, AccountStatus, Permissions } from 'app/api/models';
import { Subscription } from 'rxjs/Subscription';
import { Menu, RootMenu, MenuEntry, MenuType } from 'app/shared/menu';
import { AccountsService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * A context-specific menu shown on the side of the layout for medium-large screens
 */
@Component({
  selector: 'side-menu',
  templateUrl: 'side-menu.component.html',
  styleUrls: ['side-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideMenuComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private accountsService: AccountsService
    ) {
    super(injector);
  }

  // Namespace for template
  ApiHelper = ApiHelper

  @Input()
  menu: Menu;

  get banking(): boolean {
    return this.menu.root === RootMenu.BANKING;
  }

  title: string;
  
  accountStatuses = new BehaviorSubject<Map<String, AccountStatus>>(new Map());
  entries = new BehaviorSubject<MenuEntry[]>([]);

  ngOnInit() {
    super.ngOnInit();
    if (this.menu == null) {
      throw new Error("Missing value for menu");
    }
    this.update();
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.update();
  }

  private update(): void {
    let found = false;
    for (let root of this.login.menu(MenuType.SIDE)) {
      if (root.rootMenu == this.menu.root) {
        found = true;
        this.title = root.title;
        this.entries.next(root.entries);
        break;
      }
    }
    if (!found) {
      this.title = null;
      this.entries.next([]);
    }

    if (this.menu.root == RootMenu.BANKING && this.login.user != null) {
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
    } else {
      this.accountStatuses.next(new Map());
    }
  }

  get accounts(): AccountWithCurrency[] {
    let permissions = ((this.login.auth || {}).permissions || {});
    let banking = permissions.banking || {};
    let accountPermissions = banking.accounts || [];
    return accountPermissions.map(p => p.account);
  }
}