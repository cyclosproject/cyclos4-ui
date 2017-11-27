import { ChangeDetectionStrategy, Component, Injector, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
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
export class MenuBarComponent extends BaseComponent implements AfterViewInit {
  constructor(
    injector: Injector,
    private router: Router,
    private menuService: MenuService) {
    super(injector);
  }

  @ViewChild('tabGroup')
  tabGroup: MatTabNav;

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

  ngAfterViewInit(): void {
    const updateTabs = menu => {
      if (menu == null) {
        return;
      }
      const roots = this.roots.value;
      for (let i = 0; i < roots.length; i++) {
        if (roots[i].rootMenu === menu.root) {
          this.tabGroup._tabLinks.forEach((link, ix) => {
            if (ix === i) {
              const ref: ElementRef = link['_elementRef'];
              ref.nativeElement.click();
            }
          });
          break;
        }
      }
    };
    this.layout.menu.subscribe(updateTabs);
  }
}
