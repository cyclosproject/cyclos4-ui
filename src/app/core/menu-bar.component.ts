import { ChangeDetectionStrategy, Component, Injector, AfterViewInit } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { RootMenuEntry, MenuType, Menu, RootMenu } from 'app/shared/menu';
import { MenuService } from 'app/shared/menu.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

/**
 * A bar displayed below the top bar, with menu items
 */
@Component({
  selector: 'menu-bar',
  templateUrl: 'menu-bar.component.html',
  styleUrls: ['menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private menuService: MenuService) {
    super(injector);
  }

  roots: Observable<RootMenuEntry[]>;
  activeRoot = new BehaviorSubject<RootMenu>(null);

  private menuSubscription: Subscription;

  ngOnInit() {
    super.ngOnInit();
    this.roots = this.menuService.menu(MenuType.BAR);
    this.subscriptions.push(this.layout.menu.subscribe(menu => {
      if (menu != null) {
        this.activeRoot.next(menu.root);
      }
    }));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }

  onClick(event: MouseEvent, root: RootMenuEntry) {
    const entry = root.entries[0];
    if (entry) {
      // Whenever a menu is clicked, clear the state, because a new navigation path starts
      this.stateManager.clear();
      this.breadcrumb.clear();
      this.router.navigateByUrl(entry.url);
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
