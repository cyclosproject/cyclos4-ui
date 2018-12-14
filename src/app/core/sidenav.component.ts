import { ChangeDetectionStrategy, Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { blank } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { Menu, MenuEntry, MenuType, RootMenuEntry, RootMenu, BaseMenuEntry } from 'app/shared/menu';
import { Observable } from 'rxjs';
import { I18n } from '@ngx-translate/i18n-polyfill';

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
    private menu: MenuService,
    private router: Router,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager,
    public login: LoginService,
    public format: FormatService,
    public layout: LayoutService,
    private i18n: I18n) {
  }

  roots$: Observable<RootMenuEntry[]>;

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

  get opened(): boolean {
    return !blank(this.element.style.transform);
  }

  get rootContainer(): HTMLElement {
    return document.getElementsByClassName('root-container')[0] as HTMLElement;
  }

  open() {
    if (!this.opened) {
      const style = this.element.style;
      style.transform = 'translateX(0)';
      this.rootContainer.style.transform = `translateX(${this.element.clientWidth}px)`;
      this.layout.showBackdrop(() => this.close());
    }
  }

  close() {
    if (this.opened) {
      const style = this.element.style;
      style.transform = '';
      this.rootContainer.style.transform = '';
      this.layout.hideBackdrop();
    }
  }

  onClick(entry: MenuEntry, event: MouseEvent) {
    // Update the last selected menu
    this.menu.lastSelectedMenu = entry.menu;

    if (entry.menu === Menu.LOGOUT) {
      this.login.logout();
    } else {
      this.router.navigateByUrl(entry.url);
    }
    // Clear the shared state
    this.breadcrumb.clear();
    this.stateManager.clear();

    event.stopPropagation();
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
      return this.i18n({ value: 'Home', description: 'Menu' });
    }
    return entry.label;
  }
}
