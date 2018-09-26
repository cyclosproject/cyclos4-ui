import { Component, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { RootMenuEntry, RootMenu, MenuType } from 'app/shared/menu';
import { MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { Router } from '@angular/router';

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
    private breadcrumb: BreadcrumbService) {
  }

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
      // Whenever a menu is clicked, clear the state, because a new navigation path starts
      this.stateManager.clear();
      this.breadcrumb.clear();
      this.router.navigateByUrl(entry.url);
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
