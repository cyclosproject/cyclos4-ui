import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormatService } from 'app/core/format.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { I18n } from 'app/i18n/i18n';
import { LayoutService } from 'app/shared/layout.service';
import { BaseMenuEntry, Menu, MenuEntry, MenuType, RootMenu, RootMenuEntry } from 'app/shared/menu';
import { ShortcutService } from 'app/shared/shortcut.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { htmlCollectionToArray } from 'app/shared/helper';

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

  @ViewChild('sidenavMenu') sidenavMenu: ElementRef;

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

  shortcutSub: Subscription;

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

      const shortcuts = ['ArrowDown', 'ArrowUp', 'PageUp', 'PageDown', 'Home', 'End'];
      this.shortcutSub = this.shortcut.subscribe(shortcuts, e => this.handleShortcut(e));
      if (document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }
    }
  }

  private handleShortcut(event: KeyboardEvent) {
    const active = document.activeElement;
    const anchors = htmlCollectionToArray(this.element.getElementsByTagName('a'));
    const index = anchors.indexOf(active as HTMLAnchorElement);
    let newIndex: number;
    switch (event.key) {
      case 'ArrowUp':
        newIndex = index - 1;
        break;
      case 'ArrowDown':
        newIndex = index + 1;
        break;
      case 'PageUp':
        newIndex = index - 7;
        break;
      case 'PageDown':
        newIndex = index + 7;
        break;
      case 'Home':
        newIndex = anchors.findIndex(a => a.classList.contains('menu-item'));
        break;
      case 'End':
        newIndex = Number.MAX_SAFE_INTEGER;
        break;
      default:
        return;
    }
    if (newIndex < 0) {
      newIndex = 0;
    } else if (newIndex >= anchors.length) {
      newIndex = anchors.length - 1;
    }
    setTimeout(() => {
      const toFocus = anchors[newIndex];
      toFocus.focus();
      // let top: number;
      // if (toFocus.classList.contains('menu-item')) {
      //   const bbox = toFocus.getBoundingClientRect();
      //   top = bbox.top;
      // } else {
      //   top = 0;
      // }
      // this.sidenavMenu.nativeElement.scrollTo(0, top);
    }, 5);
  }

  close() {
    if (this.shortcutSub) {
      this.shortcutSub.unsubscribe();
      this.shortcutSub = null;
    }
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
      return this.i18n.menu.home;
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
