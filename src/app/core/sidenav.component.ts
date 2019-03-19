import { ChangeDetectionStrategy, Component, ElementRef, OnInit } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { LayoutService } from 'app/shared/layout.service';
import { BaseMenuEntry, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';
import { Messages } from 'app/messages/messages';

/**
 * The sidenav contains the menu on small devices
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sidenav',
  templateUrl: 'sidenav.component.html',
  styleUrls: ['sidenav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavComponent implements OnInit {

  constructor(
    private _element: ElementRef,
    public menu: MenuService,
    public login: LoginService,
    public format: FormatService,
    public layout: LayoutService,
    private messages: Messages) {
  }

  roots$: Observable<RootMenuEntry[]>;

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
    }
  }

  close() {
    if (this.opened) {
      const style = this.element.style;
      style.transform = '';
      this.rootContainer.style.transform = '';
      this.layout.hideBackdrop();
      this.opened = false;
      document.body.focus();
    }
  }

  onClick(entry: MenuEntry, event: MouseEvent) {
    this.menu.navigate({ entry: entry, event: event });
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
      return this.messages.menu.home;
    }
    return entry.label;
  }

  navigate(entry: MenuEntry, event: MouseEvent) {
    this.menu.navigate({ entry: entry, event: event });
  }

  logout(event: MouseEvent) {
    this.login.logout();
    event.stopPropagation();
    event.preventDefault();
    this.close();
  }
}
