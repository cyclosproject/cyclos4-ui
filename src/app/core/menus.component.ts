import { ChangeDetectionStrategy, Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Configuration } from 'app/configuration';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { NotificationService } from 'app/core/notification.service';
import { Messages } from 'app/messages/messages';
import { LayoutService } from 'app/shared/layout.service';
import { ActiveMenu, BaseMenuEntry, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown/public_api';
import { Observable } from 'rxjs';

/**
 * Renders menus in a bar, either the top bar or a dedicated menu bar
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'menus',
  templateUrl: 'menus.component.html',
  styleUrls: ['menus.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenusComponent implements OnInit {

  @Input() userName: string;
  @Input() activeMenu: ActiveMenu;
  @Input() menuType: MenuType;

  roots: Observable<RootMenuEntry[]>;
  onTop: boolean;

  constructor(
    private menu: MenuService,
    public layout: LayoutService,
    public login: LoginService,
    public breadcrumb: BreadcrumbService,
    public messages: Messages,
    public notification: NotificationService) {
  }

  get activeRoot(): RootMenu {
    return this.activeMenu == null ? null : this.activeMenu.menu.root;
  }

  @ViewChildren('dropdown') dropdowns: QueryList<BsDropdownDirective>;

  ngOnInit(): void {
    this.onTop = !Configuration.menuBar;
    this.roots = this.menu.menu(this.menuType);
  }

  onClick(event: MouseEvent, base: BaseMenuEntry) {
    this.dropdowns.forEach(d => d.hide());

    let entry: MenuEntry = null;
    if (base instanceof MenuEntry) {
      entry = base;
    } else if (base instanceof RootMenuEntry) {
      entry = base.entries[0];
    }
    this.menu.navigate({
      entry: entry,
      event: event
    });
  }
}
