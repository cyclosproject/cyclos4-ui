import { Component, Input, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';

import { RootMenu, MenuEntry, MenuType, RootMenuEntry, Menu } from 'app/shared/menu';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MenuService } from 'app/shared/menu.service';
import { AccountWithCurrency } from 'app/api/models';

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
    public menuService: MenuService
  ) {
    super(injector);
  }

  // Namespace for template
  ApiHelper = ApiHelper;

  @Input()
  hideTitle: boolean;

  get banking(): boolean {
    const menu = this.layout.menu.value;
    return menu != null && menu.root === RootMenu.BANKING;
  }

  entries = new BehaviorSubject<MenuEntry[]>([]);
  roots = new BehaviorSubject<RootMenuEntry[]>([]);
  title = new BehaviorSubject<string>(null);

  ngOnInit() {
    super.ngOnInit();

    this.menuService.menu(MenuType.SIDE).subscribe(roots => this.roots.next(roots));

    this.layout.menu.subscribe(menu => {
      this.updateFrom(menu);
    });
    this.updateFrom(this.layout.menu.value);
  }

  private updateFrom(menu: Menu) {
    let entries: MenuEntry[] = [];
    let title = null;
    if (menu != null) {
      for (const root of this.roots.value) {
        if (root.rootMenu === menu.root) {
          title = root.title;
          entries = root.entries;
          break;
        }
      }
    }
    this.entries.next(entries);
    this.title.next(title);
  }

  onAccountClicked(event: MouseEvent, account: AccountWithCurrency) {
    // Clear the shared state
    this.breadcrumb.clear();
    this.stateManager.clear();

    // Navigate to the account history details page
    this.router.navigate(this.accountLink(account));

    // Stop the event
    event.preventDefault();
    event.stopPropagation();
  }

  get accounts(): AccountWithCurrency[] {
    const permissions = ((this.login.auth || {}).permissions || {});
    const banking = permissions.banking || {};
    const accountPermissions = banking.accounts || [];
    return accountPermissions.map(p => p.account);
  }

  accountLink(account: AccountWithCurrency): string[] {
    return ['banking', 'account', ApiHelper.internalNameOrId(account.type)];
  }
}
