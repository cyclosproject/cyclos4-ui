import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { BaseComponent } from 'app/shared/base.component';
import { RootMenuEntry, MenuType, MenuEntry } from 'app/shared/menu';
import { MenuService } from 'app/shared/menu.service';

@Component({
  selector: 'sidenav-menu',
  templateUrl: 'sidenav-menu.component.html',
  styleUrls: ['sidenav-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavMenuComponent extends BaseComponent implements OnInit {
  constructor(
    injector: Injector,
    private menuService: MenuService) {
    super(injector);
  }

  @Input()
  sidenav: MatSidenav;

  roots: RootMenuEntry[];

  ngOnInit() {
    super.ngOnInit();
    this.update();
  }

  onDisplayChange() {
    super.onDisplayChange();
    this.update();
  }

  onMenuClicked(event: MouseEvent, entry: MenuEntry) {
    this.sidenav.close();
    this.breadcrumb.clear();
    this.stateManager.clear();
    this.router.navigateByUrl(entry.url);
    event.cancelBubble = true;
    event.stopPropagation();
  }

  private update() {
    this.roots = this.menuService.menu(MenuType.SIDENAV);
  }
}
