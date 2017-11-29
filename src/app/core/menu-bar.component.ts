import { ChangeDetectionStrategy, Component, Injector, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'app/shared/base.component';
import { RootMenuEntry, MenuType, Menu } from 'app/shared/menu';
import { MenuService } from 'app/shared/menu.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { MatTabNav } from '@angular/material';
import { Subscription } from 'rxjs/Subscription';

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

  roots = new BehaviorSubject<RootMenuEntry[]>([]);

  private menuSubscription: Subscription;

  ngOnInit() {
    super.ngOnInit();
    this.update();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.menuSubscription) {
      this.menuSubscription.unsubscribe();
    }
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.update();
  }

  private update() {
    this.roots.next(this.menuService.menu(MenuType.BAR));
  }

  onClick(root: RootMenuEntry) {
    const entry = root.entries[0];
    if (entry) {
      this.router.navigateByUrl(entry.url);
    }
  }
}
