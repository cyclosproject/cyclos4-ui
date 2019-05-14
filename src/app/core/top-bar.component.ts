import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, HostBinding } from '@angular/core';
import { User } from 'app/api/models';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { LayoutService } from 'app/shared/layout.service';
import { ActiveMenu, Menu, RootMenuEntry, MenuType, RootMenu } from 'app/shared/menu';
import { I18n } from 'app/i18n/i18n';
import { Observable } from 'rxjs';
import { words, empty, blurIfClick } from 'app/shared/helper';
import { Configuration } from 'app/configuration';
import { NotificationService } from 'app/core/notification.service';
import { HeadingAction } from 'app/shared/action';
import { Router, Event } from '@angular/router';

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
  blurIfClick = blurIfClick;

  userName: string;

  @HostBinding('class.has-menu') hasMenu = false;

  roots: Observable<RootMenuEntry[]>;
  @Input() activeMenu: ActiveMenu;

  constructor(
    public breadcrumb: BreadcrumbService,
    public router: Router,
    public format: FormatService,
    public login: LoginService,
    public layout: LayoutService,
    public menu: MenuService,
    public i18n: I18n,
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

  xxsActions(defaultActions: HeadingAction[], _routerEvent: Event, user: User): HeadingAction[] {
    const actions: HeadingAction[] = [];

    const addAction = (icon: string, label: string, onClick: ActiveMenu | Menu | (() => any)) => {
      if (onClick instanceof Menu || onClick instanceof ActiveMenu) {
        const activeMenu = onClick instanceof Menu ? new ActiveMenu(onClick) : onClick;
        onClick = () => {
          this.menu.navigate({
            menu: activeMenu
          });
        };
      }
      const action = new HeadingAction(icon, label, onClick, true);
      action.topBarOnly = true;
      actions.push(action);
    };

    const isHome = ['/', '/home'].includes(this.router.url);
    if (isHome) {
      // User is on home. Show either the login or logout action
      if (user) {
        addAction('logout', this.i18n.menu.logout, Menu.LOGOUT);
      } else {
        addAction('exit_to_app', this.i18n.menu.login, Menu.LOGIN);
      }
    } else {
      // If there's a breadcrumb, show the back action, otherwise, home
      const home = user ? Menu.DASHBOARD : Menu.HOME;
      if (this.breadcrumb.empty) {
        addAction('home', this.i18n.menu.home, home);
      } else {
        addAction('arrow_back', this.i18n.general.back, () => {
          if (!this.breadcrumb.back()) {
            this.menu.navigate({
              menu: new ActiveMenu(home)
            });
          }
        });
      }
    }
    // Now show the other actions
    if (!empty(defaultActions)) {
      Array.prototype.push.apply(actions, defaultActions);
    }
    return actions;
  }

}
