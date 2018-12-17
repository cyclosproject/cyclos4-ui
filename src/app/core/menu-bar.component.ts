import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { LayoutService } from 'app/shared/layout.service';
import { MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
import { Observable } from 'rxjs';
import { LoginService } from 'app/core/login.service';

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
    private breadcrumb: BreadcrumbService,
    public layout: LayoutService,
    public login: LoginService) {
  }

  @ViewChildren('rootLink') rootLinks: QueryList<ElementRef>;

  roots: Observable<RootMenuEntry[]>;
  private _activeRoot: RootMenu;
  @Input() get activeRoot(): RootMenu {
    return this._activeRoot;
  }
  set activeRoot(root: RootMenu) {
    this._activeRoot = root;
  }

  ngOnInit(): void {
    this.roots = this.menu.menu(MenuType.BAR);
  }

  onClick(event: MouseEvent, root: RootMenuEntry) {
    const entry = root.entries[0];
    if (entry && entry.url != null) {
      // Update the last selected menu
      this.menu.lastSelectedMenu = entry.menu;

      // Whenever a menu is clicked, clear the state, because a new navigation path starts
      this.stateManager.clear();
      this.breadcrumb.clear();
      this.router.navigateByUrl(entry.url);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  logout(event: MouseEvent) {
    this.login.logout();
    event.stopPropagation();
    event.preventDefault();
  }
}
