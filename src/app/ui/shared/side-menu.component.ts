import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { LayoutService } from 'app/core/layout.service';
import { ApiHelper } from 'app/shared/api-helper';
import { blurIfClick } from 'app/shared/helper';
import { MenuService } from 'app/ui/core/menu.service';
import { ActiveMenu, MenuEntry, RootMenu, SideMenuEntries } from 'app/ui/shared/menu';
import { BehaviorSubject, Subscription } from 'rxjs';

/**
 * A context-specific menu shown on the side of the layout for medium+ screens
 */
@Component({
  selector: 'side-menu',
  templateUrl: 'side-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideMenuComponent implements OnInit {
  constructor(public layout: LayoutService, public menu: MenuService) {}

  // Namespace for template
  ApiHelper = ApiHelper;
  blurIfClick = blurIfClick;

  get banking(): boolean {
    const activeMenu = this.menu.activeMenu;
    return activeMenu && activeMenu.menu.root === RootMenu.BANKING;
  }

  entries$ = new BehaviorSubject<SideMenuEntries>(null);
  subscription: Subscription;

  ngOnInit() {
    this.menu.activeMenu$.subscribe(activeMenu => {
      this.updateFrom(activeMenu);
    });
    this.updateFrom(this.menu.activeMenu);
  }

  navigate(entry: MenuEntry, event: MouseEvent) {
    this.menu.navigate({ entry, event });
  }

  private updateFrom(activeMenu: ActiveMenu) {
    if (this.subscription != null) {
      this.subscription.unsubscribe();
    }
    if (activeMenu != null) {
      this.subscription = this.menu.sideMenu(activeMenu.menu).subscribe(entries => this.entries$.next(entries));
    }
  }
}
