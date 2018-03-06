import { Component, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseComponent } from 'app/shared/base.component';
import { User, Auth } from 'app/api/models';
import { MenuEntry, RootMenu, MenuType, RootMenuEntry } from 'app/shared/menu';
import { MenuService } from 'app/shared/menu.service';

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

  menuEntries: MenuEntry[];

  @ViewChild('container')
  container: ElementRef;

  private listener: any;

  ngOnInit() {
    super.ngOnInit();
    this.update();
    this.listener = e => {
      this.hide();
      e.preventDefault();
      e.stopPropagation();
    };
    document.body.addEventListener('click', this.listener, false);
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    document.body.removeEventListener('click', this.listener, false);
  }

  protected onDisplayChange() {
    super.onDisplayChange();
    this.update();
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
  }

  private update() {
    if (this.login.user == null) {
      // Don't update the personal menu if there's no logged user - it won't be shown
      return;
    }
    const roots = this.menuService.menu(MenuType.PERSONAL);
    let personal: RootMenuEntry = null;
    for (const root of roots) {
      if (root.rootMenu === RootMenu.PERSONAL) {
        personal = root;
        break;
      }
    }
    this.menuEntries = (personal || {} as RootMenuEntry).entries || [];
  }
}
