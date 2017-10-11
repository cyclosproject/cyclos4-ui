import { Component, Input, ElementRef, ViewChild, ChangeDetectionStrategy, Injector } from '@angular/core';
import { FormatService } from "app/core/format.service";
import { BaseComponent } from 'app/shared/base.component';
import { User, Auth } from 'app/api/models';
import { Subscription } from 'rxjs/Subscription';
import { MenuEntry, RootMenu, Menu, MenuType, RootMenuEntry } from 'app/shared/menu';

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
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.update();
    document.body.addEventListener("click", e => this.hide(), false);
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
      let style = this.container.nativeElement.style as CSSStyleDeclaration;
      if (style.display == 'none') {
        // Show
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
      } else {
        // Hide
        this.hide();
      }
    }
  }

  hide() {
    let style = this.container.nativeElement.style as CSSStyleDeclaration;
    style.opacity = '0';
    setTimeout(() => style.display = 'none', 500);
  }

  private update() {
    let roots = this.login.menu(MenuType.PERSONAL);
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