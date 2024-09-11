import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { LayoutService } from 'app/core/layout.service';
import { ActionsLeft, ActionsRight, ArrowsVertical } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { AbstractComponent } from 'app/shared/abstract.component';
import { handleKeyboardFocus } from 'app/shared/helper';
import { LoginService } from 'app/ui/core/login.service';
import { MenuService } from 'app/ui/core/menu.service';
import { ActiveMenu, BaseMenuEntry, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/ui/shared/menu';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

/**
 * The sidenav contains the menu on small devices
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sidenav',
  templateUrl: 'sidenav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent extends AbstractComponent implements OnInit {
  @HostBinding('class.has-top-bar') hasTopBar = true;
  @HostBinding('class.is-sidenav') isSidenav = true;

  @ViewChild('sidenavMenu', { static: true }) sidenavMenu: ElementRef;

  constructor(
    injector: Injector,
    private _element: ElementRef,
    public menu: MenuService,
    public login: LoginService,
    public dataForFrontend: DataForFrontendHolder,
    public layout: LayoutService
  ) {
    super(injector);
  }

  roots$: Observable<RootMenuEntry[]>;

  private openSubs: Subscription[] = [];

  opened$ = new BehaviorSubject(false);
  get opened(): boolean {
    return this.opened$.value;
  }
  set opened(opened: boolean) {
    this.opened$.next(opened);
  }

  ngOnInit() {
    super.ngOnInit();
    this.roots$ = this.menu.menu(MenuType.SIDENAV);
    this.layout.gtsm$.subscribe(() => this.close());

    // Show the sidenav on small devices when pressing the left actions
    this.shortcut.subscribe(ActionsLeft, () => {
      if (this.layout.gtmd) {
        return false;
      }
      this.toggle();
    });
  }

  toggle() {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  get element(): HTMLElement {
    return this._element.nativeElement;
  }

  get rootContainer(): HTMLElement {
    return document.getElementsByClassName('root-container')[0] as HTMLElement;
  }

  open() {
    if (!this.opened) {
      // Sometimes the --window-width variable is not updated, and the close icon is not visible
      this.layout.updateWindowWidth();
      this.layout.setFocusTrap('sidenav-menu');
      const style = this.element.style;
      style.transform = 'translateX(0)';
      if (this.layout.gtxs) {
        this.rootContainer.style.transform = `translateX(${this.element.clientWidth}px)`;
      }
      const first = this.element.getElementsByClassName('menu-item')[0] as HTMLElement;
      if (first) {
        setTimeout(() => first.focus(), 1);
      }
      this.layout.showBackdrop(() => this.close());
      this.opened = true;
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        if (active) {
          active.blur();
        }
      }, 5);
      this.openSubs.push(
        this.shortcut.subscribe(ArrowsVertical, e => handleKeyboardFocus(this.layout, this.element, e))
      );
      this.openSubs.push(
        this.shortcut.subscribe(ActionsRight, () => {
          this.loginOrLogout();
        })
      );
    }
  }

  close() {
    if (this.opened) {
      this.layout.setFocusTrap(null);
      const style = this.element.style;
      style.transform = '';
      this.rootContainer.style.transform = '';
      this.layout.hideBackdrop();
      this.opened = false;
      document.body.focus();
      this.openSubs.forEach(s => s.unsubscribe());
      this.openSubs = [];
    }
  }

  onClick(entry: MenuEntry, event: MouseEvent) {
    this.menu.navigate({ entry, event });
    this.close();
  }

  isHome(root: RootMenuEntry) {
    return [RootMenu.HOME, RootMenu.DASHBOARD].includes(root.rootMenu);
  }

  icon(entry: BaseMenuEntry) {
    if (entry instanceof MenuEntry && entry.menu === Menu.DASHBOARD && this.layout.ltmd) {
      // For mobile, the dashboard is shown as home
      return SvgIcon.HouseDoor2;
    }
    return entry.icon;
  }

  label(entry: BaseMenuEntry) {
    if (entry instanceof MenuEntry && entry.menu === Menu.DASHBOARD && this.layout.ltmd) {
      // For mobile, the dashboard is shown as home
      return this.i18n.menu.home;
    }
    return entry.label;
  }

  navigate(entry: MenuEntry, event: MouseEvent) {
    this.menu.navigate({ entry, event });
  }

  loginOrLogout(event?: Event) {
    if (this.login.user) {
      this.login.logout();
    } else {
      this.menu.navigate({ menu: new ActiveMenu(Menu.LOGIN) });
    }
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.close();
  }
}
