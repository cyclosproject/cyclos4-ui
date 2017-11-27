import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'app/shared/base.component';
import { BaseMenuEntry, Menu, MenuEntry } from 'app/shared/menu';

/**
 * Renders a menu item
 */
@Component({
  selector: 'menu-item',
  templateUrl: 'menu-item.component.html',
  styleUrls: ['menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItemComponent extends BaseComponent {
  constructor(injector: Injector, private router: Router) {
    super(injector);
  }

  @Input()
  active: boolean;

  @Input()
  entry: BaseMenuEntry;

  @Input()
  iconClass = 'mat-18';

  @Output()
  click = new EventEmitter<Menu>();

  get url(): string {
    if (this.entry instanceof MenuEntry) {
      return this.entry.url;
    }
    return null;
  }

  handleClick() {
    if (this.entry instanceof MenuEntry) {
      const menu = this.entry.menu;
      if (menu === Menu.LOGOUT) {
        this.login.logout();
      } else if (this.entry.url) {
        this.router.navigateByUrl(this.entry.url);
      }
      this.click.emit(menu);
    }
  }
}
