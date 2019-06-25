import {
  ChangeDetectionStrategy, Component, EventEmitter, HostBinding,
  Injector, Input, OnChanges, OnInit, Output, SimpleChanges
} from '@angular/core';
import { Event, Router } from '@angular/router';
import { User } from 'app/api/models';
import { Configuration } from 'app/configuration';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { menuAnchorId } from 'app/core/menus.component';
import { NotificationService } from 'app/core/notification.service';
import { I18n } from 'app/i18n/i18n';
import { AbstractComponent } from 'app/shared/abstract.component';
import { HeadingAction } from 'app/shared/action';
import { blurIfClick, empty, words } from 'app/shared/helper';
import { Breakpoint, LayoutService } from 'app/shared/layout.service';
import { ActiveMenu, Menu, MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';
import { MenuDensity } from 'app/core/menu-density';

const MaxUserDisplaySize = 30;
const MaxUserDisplaySizeMenu = 15;
const MenuThesholdLarge = 4;
const MenuThesholdExtraLarge = 5;
const ProfileMenus = [Menu.MY_PROFILE, Menu.EDIT_MY_PROFILE];

/**
 * The top bar, which is always visible
 */
@Component({
  selector: 'top-bar',
  templateUrl: 'top-bar.component.html',
  styleUrls: ['top-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent extends AbstractComponent implements OnInit, OnChanges {
  // Export to template
  RootMenu = RootMenu;
  Menu = Menu;
  MenuType = MenuType;
  blurIfClick = blurIfClick;

  userName: string;
  roots$ = new BehaviorSubject<RootMenuEntry[]>([]);
  forcedActive: RootMenuEntry;

  get roots(): RootMenuEntry[] {
    return this.roots$.value;
  }

  @HostBinding('class.has-menu') hasMenu = false;
  @Input() activeMenu: ActiveMenu;

  constructor(
    injector: Injector,
    public layout: LayoutService,
    public i18n: I18n,
    public notification: NotificationService,
    public menu: MenuService,
    public router: Router,
    public breadcrumb: BreadcrumbService,
    public login: LoginService) {
    super(injector);
  }

  @Input() user: User;
  @Input() breakpoints: Set<Breakpoint>;
  @Output() toggleSidenav = new EventEmitter<void>();

  ngOnInit(): void {
    if (!Configuration.menuBar) {
      this.hasMenu = true;
      this.addSub(this.menu.menu(MenuType.BAR).subscribe(roots => {
        this.roots$.next(roots.filter(r => r.rootMenu !== RootMenu.PERSONAL));
      }));
    }
    const maxDisplaySize = this.hasMenu ? MaxUserDisplaySizeMenu : MaxUserDisplaySize;
    this.login.user$.subscribe(user => {
      this.userName = user == null ? '' : words(user.display, maxDisplaySize);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeMenu) {
      this.updateMenuTextWidts();
    }
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

  get density(): MenuDensity {
    if (!this.hasMenu) {
      return null;
    }
    const threshold = this.breakpoints.has('xl') ? MenuThesholdExtraLarge : MenuThesholdLarge;
    const roots = this.roots;
    return roots.length < threshold ? MenuDensity.Spacious
      : roots.length === threshold ? MenuDensity.Medium
        : MenuDensity.Dense;
  }

  dropdownShown(root: RootMenuEntry) {
    this.forcedActive = root;
    this.updateMenuTextWidts();
  }

  dropdownHidden() {
    this.forcedActive = null;
    this.updateMenuTextWidts();
  }

  private updateMenuTextWidts() {
    const activeRoot = this.forcedActive || this.activeRoot;
    for (const root of this.roots) {
      const anchor = document.getElementById(menuAnchorId(root));
      if (!anchor) {
        continue;
      }
      const menuText = anchor.getElementsByClassName('menu-text').item(0) as HTMLElement;
      const active = root === activeRoot || root.rootMenu === activeRoot;
      let width: number;
      if (active) {
        // For the active menu, measure the text width
        const style = getComputedStyle(menuText);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = style.font;
        const metrics = ctx.measureText(menuText.textContent || menuText.innerText);
        width = metrics.width;
      } else {
        width = 0;
      }
      menuText.style.width = `${width}px`;
    }
  }

  customNgClass(menu: Menu) {
    const classes = ['nav-item'];
    // Only use special classes for custom menus if the menu is integrated in the top bar
    if (this.hasMenu) {
      classes.push(`menu-item`);
      const density = this.user == null
        ? this.density
        : MenuDensity.Custom; // When there's a logged user with menu, use the custom density
      classes.push(`density-${density}`);
      if (this.isActive(menu)) {
        classes.push('active');
      }
    } else {
      classes.push(`density-${MenuDensity.Custom}`);
    }
    return classes;
  }

  private isActive(menu: Menu): boolean {
    if (!this.activeMenu) {
      return false;
    }
    const active = this.activeMenu.menu;
    if (ProfileMenus.includes(menu)) {
      return ProfileMenus.includes(active);
    }
    return menu === active;
  }

  get separatorNgClass() {
    return ['menu-separator', `density-${this.density}`];
  }
}
