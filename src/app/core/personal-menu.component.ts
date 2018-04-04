import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { User, Auth } from 'app/api/models';
import { MenuEntry, RootMenu, MenuType, RootMenuEntry } from 'app/shared/menu';
import { MenuService } from 'app/shared/menu.service';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';

/**
 * A popup menu shown when clicking the personal icon on top
 */
@Component({
  selector: 'personal-menu',
  templateUrl: 'personal-menu.component.html',
  styleUrls: ['personal-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalMenuComponent extends BaseComponent {
  constructor(
    injector: Injector,
    private menuService: MenuService) {
    super(injector);
  }

  menuEntries: Observable<MenuEntry[]>;

  @ViewChild('container')
  container: ElementRef;

  private listener: any;

  ngOnInit() {
    super.ngOnInit();
    this.menuEntries = this.menuService.menu(MenuType.PERSONAL).pipe(
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
    this.listener = (e: MouseEvent) => {
      if (!e.srcElement.classList.contains('popup')) {
        this.hide();
      }
    };
  }

  protected onDisplayChange() {
    super.onDisplayChange();
    this.hide();
  }

  get user(): User {
    return this.login.user;
  }

  get auth(): Auth {
    return this.login.auth;
  }

  toggle(a: HTMLElement) {
    if (this.container) {
      if (this.visible) {
        // Hide
        this.hide();
      } else {
        // Show
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
        style.top = (topAnchor.offsetTop + topAnchor.offsetHeight) + 'px';
        if (this.layout.xs) {
          style.left = '0';
        } else {
          const el = this.container.nativeElement as HTMLElement;
          style.left = (a.offsetLeft + a.offsetWidth - el.offsetWidth) + 'px';
        }
        style.visibility = 'visible';
        style.opacity = '1';
        document.body.addEventListener('click', this.listener, true);
      }
    }
  }

  get visible(): boolean {
    const style = this.container.nativeElement.style as CSSStyleDeclaration;
    return !(style.display === 'none' || parseFloat(style.opacity) === 0);
  }

  hide() {
    if (!this.visible) {
      // Already hidden
      return;
    }
    const style = this.container.nativeElement.style as CSSStyleDeclaration;
    style.opacity = '0';
    setTimeout(() => style.display = 'none', 500);
    document.body.removeEventListener('click', this.listener, true);
  }

  clearState() {
    this.breadcrumb.clear();
    this.stateManager.clear();
  }
}
