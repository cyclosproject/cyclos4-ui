import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';
import { User, Auth } from 'app/api/models';
import { Subscription } from 'rxjs/Subscription';
import { MenuEntry, RootMenu, Menu, MenuType, RootMenuEntry } from 'app/shared/menu';
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

  ngOnInit() {
    super.ngOnInit();
    this.update();
    document.body.addEventListener("click", e => {
      this.hide();
      e.cancelBubble = true;
    }, false);
  }

  menuEntries: MenuEntry[];

  protected onDisplayChange() {
    super.onDisplayChange();
    this.update();
    this.hide();
  }

  @ViewChild("container")
  container: ElementRef;

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
        let style = this.container.nativeElement.style as CSSStyleDeclaration;
        style.visibility = 'hidden';
        style.opacity = '0';
        style.display = '';
        var topAnchor: HTMLElement = null;
        let parent = a.parentElement;
        while (parent != null) {
          if (parent.tagName.toLowerCase() == 'top-bar') {
            topAnchor = parent;
          }
          parent = parent.parentElement;
        }
        topAnchor = topAnchor || a;
        style.top = (topAnchor.offsetTop + topAnchor.offsetHeight) + 'px';
        if (this.layout.xs) {
          style.left = "0";
        } else {
          let el = this.container.nativeElement as HTMLElement;
          style.left = (a.offsetLeft + a.offsetWidth - el.offsetWidth) + 'px';
        }
        style.visibility = 'visible';
        style.opacity = '1';
      }
    }
  }

  get visible(): boolean {
    let style = this.container.nativeElement.style as CSSStyleDeclaration;
    return !(style.display == 'none' || parseFloat(style.opacity) == 0);
  }

  hide() {
    if (!this.visible) {
      // Already hidden
      return;
    }
    let style = this.container.nativeElement.style as CSSStyleDeclaration;
    style.opacity = '0';
    setTimeout(() => style.display = 'none', 500);
  }

  private update() {
    let roots = this.menuService.menu(MenuType.PERSONAL);
    let personal: RootMenuEntry = null;
    for (let root of roots) {
      if (root.rootMenu == RootMenu.PERSONAL) {
        personal = root;
        break;
      }
    }
    this.menuEntries = (personal || {} as RootMenuEntry).entries || [];
  }
}