import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, HostBinding } from '@angular/core';
import { User } from 'app/api/models';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { LayoutService } from 'app/shared/layout.service';
import { ActiveMenu, Menu, RootMenuEntry, MenuType, RootMenu } from 'app/shared/menu';
import { Messages } from 'app/messages/messages';
import { Observable } from 'rxjs';
import { words } from 'app/shared/helper';
import { Configuration } from 'app/configuration';
import { NotificationService } from 'app/core/notification.service';

const MAX_USER_DISPLAY_SIZE = 30;
const MAX_USER_DISPLAY_SIZE_MENU = 15;

/**
 * The top bar, which is always visible
 */
@Component({
  selector: 'top-bar',
  templateUrl: 'top-bar.component.html',
  styleUrls: ['top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {
  // Export to template
  RootMenu = RootMenu;
  Menu = Menu;
  MenuType = MenuType;

  userName: string;

  @HostBinding('class.has-menu') hasMenu = false;

  roots: Observable<RootMenuEntry[]>;
  @Input() activeMenu: ActiveMenu;

  constructor(
    public breadcrumb: BreadcrumbService,
    public format: FormatService,
    public login: LoginService,
    public layout: LayoutService,
    public menu: MenuService,
    public messages: Messages,
    public notification: NotificationService) {
  }

  @Input() user: User;
  @Input() principal: string;

  @Output() toggleSidenav = new EventEmitter<void>();

  ngOnInit(): void {
    if (!Configuration.menuBar) {
      this.hasMenu = true;
      this.roots = this.menu.menu(MenuType.BAR);
    }
    const maxDisplaySize = this.hasMenu ? MAX_USER_DISPLAY_SIZE_MENU : MAX_USER_DISPLAY_SIZE;
    this.login.user$.subscribe(user => {
      this.userName = user == null ? '' : words(user.display, maxDisplaySize);
    });
  }

  navigate(menu: Menu, event: MouseEvent) {
    this.menu.navigate({ menu: new ActiveMenu(menu), event: event });
  }

  get activeRoot(): RootMenu {
    return this.activeMenu == null ? null : this.activeMenu.menu.root;
  }

}
