import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';

import { Subscription } from 'rxjs/Subscription';
import { Menu, RootMenu, MenuEntry, MenuType } from 'app/shared/menu';
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
  ApiHelper = ApiHelper

  @Input()
  menu: Menu;

  @Input()
  hideTitle: boolean;

  get banking(): boolean {
    return this.menu.root === RootMenu.BANKING;
  }

  title: string;
  
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
    for (let root of this.menuService.menu(MenuType.SIDE)) {
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
  }

  get accounts(): AccountWithCurrency[] {
    let permissions = ((this.login.auth || {}).permissions || {});
    let banking = permissions.banking || {};
    let accountPermissions = banking.accounts || [];
    return accountPermissions.map(p => p.account);
  }
}