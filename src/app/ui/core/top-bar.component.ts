import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Event, Router } from '@angular/router';
import { User } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { Breakpoint, LayoutService } from 'app/core/layout.service';
import { NotificationService } from 'app/core/notification.service';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { AbstractComponent } from 'app/shared/abstract.component';
import { HeadingAction } from 'app/shared/action';
import { blurIfClick, empty, words } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { LoginService } from 'app/ui/core/login.service';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { MenuDensity } from 'app/ui/core/menu-density';
import { MenuService } from 'app/ui/core/menu.service';
import { menuAnchorId } from 'app/ui/core/menus.component';
import { MessageHelperService } from 'app/ui/core/message-helper.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { ActiveMenu, Menu, MenuType, RootMenu, RootMenuEntry } from 'app/ui/shared/menu';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent extends AbstractComponent implements OnInit, OnDestroy, OnChanges {
  @HostBinding('class.has-top-bar') hasTopBar = true;
  @HostBinding('class.has-menu') hasMenu = false;
  @HostBinding('class.has-user') @Input() user: User;

  @ViewChild('brand') brand: ElementRef<HTMLElement>;
  @ViewChild('menuContainer') menuContainer: ElementRef<HTMLElement>;
  @ViewChild('sidenavTrigger') sidenavTrigger: ElementRef<HTMLElement>;

  resizeListener: any;

  // Export to template
  RootMenu = RootMenu;
  Menu = Menu;
  MenuType = MenuType;
  blurIfClick = blurIfClick;

  userName: string;
  roots$ = new BehaviorSubject<RootMenuEntry[]>([]);
  forcedActive: RootMenuEntry;
  shoppingCart: boolean;

  get roots(): RootMenuEntry[] {
    return this.roots$.value;
  }

  @Input() activeMenu: ActiveMenu;
  @Input() breakpoints: Set<Breakpoint>;
  @Output() toggleSidenav = new EventEmitter<void>();

  constructor(
    injector: Injector,
    private changeDetector: ChangeDetectorRef,
    public authHelper: AuthHelperService,
    public layout: LayoutService,
    public uiLayout: UiLayoutService,
    @Inject(I18nInjectionToken) public i18n: I18n,
    public notification: NotificationService,
    public menu: MenuService,
    public router: Router,
    public breadcrumb: BreadcrumbService,
    public login: LoginService,
    public marketplaceHelper: MarketplaceHelperService,
    public messageHelper: MessageHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Whenever there are changes to message or notification status, force a change detection
    const detectChanges = () => setTimeout(() => this.changeDetector.detectChanges(), 100);
    this.addSub(this.messageHelper.messageStatus$.subscribe(detectChanges));
    this.addSub(this.notification.notificationsStatus$.subscribe(detectChanges));

    if (!this.dataForFrontendHolder.dataForFrontend.menuBar) {
      this.hasMenu = true;
      this.addSub(
        this.menu.menu(MenuType.BAR).subscribe(roots => {
          this.roots$.next(roots.filter(r => r.rootMenu !== RootMenu.PERSONAL));
          this.updateTitle();
        })
      );
    }
    const maxDisplaySize = this.hasMenu ? MaxUserDisplaySizeMenu : MaxUserDisplaySize;
    this.addSub(
      this.login.user$.subscribe(user => {
        this.userName = user == null ? '' : words(user.display, maxDisplaySize);
        this.shoppingCart = this.dataForFrontendHolder.auth.permissions?.marketplace?.userWebshop?.purchase;
        this.updateTitle();
      })
    );
    this.addSub(this.uiLayout.currentPage$.subscribe(() => this.updateTitle()));

    this.addSub(
      fromEvent(window, 'resize')
        .pipe(debounceTime(50))
        .subscribe(() => this.updateTitle())
    );

    setTimeout(() => this.updateTitle(), 10);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    window.removeEventListener('resize', this.resizeListener);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.activeMenu) {
      this.updateMenuTextWidths();
    }
  }

  navigate(menu: Menu, event: MouseEvent) {
    this.menu.navigate({ menu: new ActiveMenu(menu), event });
  }

  get activeRoot(): RootMenu {
    return this.activeMenu == null ? null : this.activeMenu.menu.root;
  }

  xxsActions(defaultActions: HeadingAction[], _routerEvent: Event, user: User): HeadingAction[] {
    const actions: HeadingAction[] = [];

    const addAction = (id: string, icon: SvgIcon, label: string, onClick: ActiveMenu | Menu | (() => any)) => {
      if (onClick instanceof Menu || onClick instanceof ActiveMenu) {
        const activeMenu = onClick instanceof Menu ? new ActiveMenu(onClick) : onClick;
        onClick = () => {
          this.menu.navigate({
            menu: activeMenu
          });
        };
      }
      const action = new HeadingAction(icon, label, onClick, true);
      action.id = id;
      action.breakpoint = 'xxs';
      actions.push(action);
    };

    const isHome = ['/', '/home'].includes(this.router.url);
    if (isHome) {
      // User is on home. Show either the login or logout action
      if (user) {
        addAction('logout', SvgIcon.Logout2, this.i18n.menu.logout, Menu.LOGOUT);
      } else {
        addAction('login', SvgIcon.Login2, this.i18n.menu.login, Menu.LOGIN);
      }
    } else {
      // If there's a breadcrumb, show the back action, otherwise, home
      const home = user ? Menu.DASHBOARD : Menu.HOME;
      if (!this.breadcrumb.dashboardOnly) {
        if (this.breadcrumb.empty) {
          addAction('home', SvgIcon.HouseDoor2, this.i18n.menu.home, home);
        } else {
          addAction('back', SvgIcon.ArrowLeft, this.i18n.general.back, () => {
            if (!this.breadcrumb.back()) {
              this.menu.navigate({
                menu: new ActiveMenu(home)
              });
            }
          });
        }
      }
    }
    // Now show the other actions
    if (!empty(defaultActions)) {
      for (const action of defaultActions) {
        if (!action.id || !actions.find(a => a.id === action.id)) {
          actions.push(action);
        }
      }
    }
    return actions;
  }

  get density(): MenuDensity {
    if (this.layout.ltmd) {
      return MenuDensity.Custom;
    }
    if (!this.hasMenu) {
      return null;
    }
    const threshold = this.breakpoints.has('xl') ? MenuThesholdExtraLarge : MenuThesholdLarge;
    const roots = this.roots;
    return roots.length < threshold
      ? MenuDensity.Spacious
      : roots.length === threshold
      ? MenuDensity.Medium
      : MenuDensity.Dense;
  }

  dropdownShown(root: RootMenuEntry) {
    this.forcedActive = root;
    this.updateMenuTextWidths();
  }

  dropdownHidden() {
    this.forcedActive = null;
    this.updateMenuTextWidths();
  }

  private updateMenuTextWidths() {
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

    this.updateTitle();
  }

  private updateTitle() {
    const brand = this.brand?.nativeElement;
    const menuContainer = this.menuContainer?.nativeElement;
    if (brand && menuContainer) {
      const sidenavTrigger = this.sidenavTrigger?.nativeElement;
      brand.style.display = 'none';
      const parentDim = brand.parentElement.getBoundingClientRect();
      const menuDim = this.layout.xxs ? { width: 22 } : menuContainer.getBoundingClientRect();
      const sidenavDim = sidenavTrigger ? sidenavTrigger.getBoundingClientRect() : { width: 0 };
      brand.style.maxWidth = `${parentDim.width - menuDim.width - sidenavDim.width - 10}px`;
      brand.style.display = '';
    }
  }

  customNgClass(menu: Menu) {
    const classes = ['nav-item'];
    // Only use special classes for custom menus if the menu is integrated in the top bar
    if (this.hasMenu) {
      classes.push(`menu-item`);
      const density = this.user == null ? this.density : MenuDensity.Custom; // When there's a logged user with menu, use the custom density
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
