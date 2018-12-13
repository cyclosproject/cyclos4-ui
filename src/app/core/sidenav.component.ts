import { ChangeDetectionStrategy, Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { blank } from 'app/shared/helper';
import { LayoutService } from 'app/shared/layout.service';
import { Menu, MenuEntry, MenuType, RootMenuEntry } from 'app/shared/menu';
import { Observable } from 'rxjs';

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

  private glass: HTMLElement;

  constructor(
    private _element: ElementRef,
    private menu: MenuService,
    private router: Router,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager,
    public login: LoginService,
    public format: FormatService,
    public layout: LayoutService) {
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
      if (this.glass == null) {
        this.glass = document.createElement('div');
        this.glass.className = 'glass';
        this.glass.addEventListener('click', () => this.close(), false);
        document.body.appendChild(this.glass);
      }
      setTimeout(() => this.glass.style.opacity = '1', 1);
    }
  }

  close() {
    if (this.opened) {
      const style = this.element.style;
      style.transform = '';
      this.rootContainer.style.transform = '';
      this.glass.style.opacity = '';
      setTimeout(() => {
        this.glass.parentElement.removeChild(this.glass);
        this.glass = null;
      }, 300);
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
}
