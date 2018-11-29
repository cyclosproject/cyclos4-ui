import { Component, ChangeDetectionStrategy, OnInit, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { RootMenuEntry, MenuType, Menu, MenuEntry, RootMenu } from 'app/shared/menu';
import { MenuService } from 'app/core/menu.service';
import { FormatService } from 'app/core/format.service';
import { LayoutService } from 'app/shared/layout.service';
import { blank } from 'app/shared/helper';
import { LoginService } from 'app/core/login.service';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { StateManager } from 'app/core/state-manager';
import { map } from 'rxjs/operators';

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
    public layout: LayoutService) {
  }

  roots$: Observable<RootMenuEntry[]>;

  ngOnInit() {
    this.roots$ = this.menu.menu(MenuType.SIDENAV).pipe(
      map(roots => {
        if (this.login.user == null) {
          // Generally login / registration are shown in the end.
          // For the sidenav, put them first.
          const login = roots.find(r => r.rootMenu === RootMenu.LOGIN);
          const registration = roots.find(r => r.rootMenu === RootMenu.REGISTRATION);
          const head = [login];
          if (registration) {
            head.push(registration);
          }
          const tail = roots.filter(r => !head.includes(r));
          return [...head, ...tail];
        }
        return roots;
      })
    );
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

  open() {
    if (!this.opened) {
      const style = this.element.style;
      style.transform = 'translateX(0)';
      style.opacity = '1';
    }
  }

  close() {
    if (this.opened) {
      const style = this.element.style;
      style.transform = '';
      style.opacity = '';
    }
  }

  onClick(entry: MenuEntry, event: MouseEvent) {
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
