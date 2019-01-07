import { ChangeDetectionStrategy, Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { LoginService } from 'app/core/login.service';
import { ActiveMenu, MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { LayoutService } from 'app/shared/layout.service';
import { BaseMenuEntry, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown/public_api';
import { Observable } from 'rxjs';
import { Messages } from 'app/messages/messages';

/**
 * A bar displayed on large layouts with the root menu items
 */
@Component({
  selector: 'menu-bar',
  templateUrl: 'menu-bar.component.html',
  styleUrls: ['menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent implements OnInit {
  constructor(
    private router: Router,
    private menu: MenuService,
    private stateManager: StateManager,
    public breadcrumb: BreadcrumbService,
    public layout: LayoutService,
    public login: LoginService,
    public messages: Messages) {
  }

  roots: Observable<RootMenuEntry[]>;
  @Input() activeMenu: ActiveMenu;

  get activeRoot(): RootMenu {
    return this.activeMenu == null ? null : this.activeMenu.menu.root;
  }

  @ViewChildren('dropdown') dropdowns: QueryList<BsDropdownDirective>;

  ngOnInit(): void {
    this.roots = this.menu.menu(MenuType.BAR);
  }

  onClick(event: MouseEvent, base: BaseMenuEntry) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target as HTMLElement;
    target.blur();
    this.dropdowns.forEach(d => d.hide());

    let entry: MenuEntry = null;
    if (base instanceof MenuEntry) {
      entry = base;
    } else if (base instanceof RootMenuEntry) {
      entry = base.entries[0];
    }

    if (entry && entry.url != null) {
      // Update the last selected menu
      this.menu.navigate(entry);

      // Whenever a menu is clicked, clear the state, because a new navigation path starts
      this.stateManager.clear();
      this.breadcrumb.clear();
      this.router.navigateByUrl(entry.url);
    }
  }

  logout(event: MouseEvent) {
    this.login.logout();
    event.stopPropagation();
    event.preventDefault();
  }
}
