import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { I18n } from 'app/i18n/i18n';
import { handleKeyboardFocus } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { ActiveMenu, BaseMenuEntry, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
import { ActionsLeft, ActionsRight, ArrowsVertical, ShortcutService } from 'app/shared/shortcut.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

/**
 * The sidenav contains the menu on small devices
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavComponent implements OnInit {

  @ViewChild('sidenavMenu', { static: true }) sidenavMenu: ElementRef;

  constructor(
    private _element: ElementRef,
    public menu: MenuService,
    public login: LoginService,
    public format: FormatService,
    public layout: LayoutService,
    private shortcut: ShortcutService,
    private i18n: I18n) {
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
      this.openSubs.push(this.shortcut.subscribe(ArrowsVertical, e =>
        handleKeyboardFocus(this.layout, this.element, e)));
      this.openSubs.push(this.shortcut.subscribe(ActionsRight, () => {
        this.loginOrLogout();
      }));
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
      return 'home';
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
