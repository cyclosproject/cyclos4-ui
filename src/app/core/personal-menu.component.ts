import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { MenuEntry, RootMenu, MenuType, RootMenuEntry, Menu } from 'app/shared/menu';
import { MenuService } from 'app/core/menu.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from 'app/api/models/user';
import { LayoutService } from 'app/shared/layout.service';
import { Router } from '@angular/router';
import { LoginService } from 'app/core/login.service';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { StateManager } from 'app/core/state-manager';

/**
 * A popup menu shown when clicking the personal icon on top
 */
@Component({
  selector: 'personal-menu',
  templateUrl: 'personal-menu.component.html',
  styleUrls: ['personal-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalMenuComponent implements OnInit {
  constructor(
    public layout: LayoutService,
    public menu: MenuService,
    private router: Router,
    private login: LoginService,
    private breadcrumb: BreadcrumbService,
    private stateManager: StateManager

  ) { }

  @Input() user: User;
  @Input() principal: string;

  menuEntries: Observable<MenuEntry[]>;

  showContent = new BehaviorSubject(false);

  @ViewChild('container') container: ElementRef;

  private anchor: any;

  private listener: any;

  ngOnInit() {
    this.menuEntries = this.menu.menu(MenuType.PERSONAL).pipe(
      map(roots => {
        if (this.login.user == null) {
          // If there's no logged user, there's also no personal menu to show
          return null;
        }
        // Return only the entries in the personal menu
        let personal: RootMenuEntry = null;
        for (const root of roots) {
          if (root.rootMenu === RootMenu.PERSONAL) {
            personal = root;
            break;
          }
        }
        return (personal || {} as RootMenuEntry).entries || [];
      })
    );

    this.layout.breakpointChanges.subscribe(() => this.hide());

    this.listener = (e: MouseEvent) => {
      let src = e.srcElement;
      let ignore = false;
      while (src != null) {
        if (src.classList.contains('popup') || src === this.anchor) {
          ignore = true;
          break;
        }
        src = src.parentElement;
      }
      if (!ignore) {
        this.hide();
      }
    };
  }

  toggle(a: HTMLElement) {
    if (this.container) {
      if (this.visible) {
        // Hide
        this.hide();
      } else {
        // Show
        this.show(a);
      }
    }
  }

  get visible(): boolean {
    const style = this.container.nativeElement.style as CSSStyleDeclaration;
    return !(style.display === 'none' || parseFloat(style.opacity) === 0.0);
  }

  show(a: HTMLElement) {
    if (this.visible) {
      // Already visible
      return;
    }
    this.anchor = a;
    const style = this.container.nativeElement.style as CSSStyleDeclaration;
    style.visibility = 'hidden';
    style.opacity = '0';
    style.display = '';
    let topAnchor: HTMLElement = null;
    let parent = a.parentElement;
    while (parent != null) {
      if (parent.tagName.toLowerCase() === 'top-bar') {
        topAnchor = parent;
      }
      parent = parent.parentElement;
    }
    topAnchor = topAnchor || a;
    this.showContent.next(true);
    setTimeout(() => {
      style.top = (topAnchor.offsetTop + topAnchor.offsetHeight) + 'px';
      if (this.layout.ltsm) {
        style.left = '0';
      } else {
        const el = this.container.nativeElement as HTMLElement;
        style.left = (a.offsetLeft + a.offsetWidth - el.offsetWidth) + 'px';
      }
      style.visibility = 'visible';
      style.opacity = '1';
      document.body.addEventListener('click', this.listener, true);
    }, 1);
  }

  hide() {
    if (!this.visible) {
      // Already hidden
      return;
    }
    const style = this.container.nativeElement.style as CSSStyleDeclaration;
    style.opacity = '0';
    setTimeout(() => {
      style.display = 'none';
      this.showContent.next(false);
    }, 500);
    document.body.removeEventListener('click', this.listener, true);
  }

  clearState() {
    this.breadcrumb.clear();
    this.stateManager.clear();
  }

  menuClicked(entry: MenuEntry) {
    const menu = entry.menu;
    if (menu === Menu.LOGOUT) {
      this.login.logout();
    } else if (entry.url) {
      this.clearState();
      this.router.navigateByUrl(entry.url);
    }
  }
}
