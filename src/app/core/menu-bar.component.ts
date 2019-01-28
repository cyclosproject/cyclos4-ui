import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LoginService } from 'app/core/login.service';
import { ActiveMenu } from 'app/core/menu.service';
import { Messages } from 'app/messages/messages';
import { LayoutService } from 'app/shared/layout.service';
import { MenuType } from 'app/shared/menu';

/**
 * A bar displayed on large layouts with the root menu items
 */
@Component({
  selector: 'menu-bar',
  templateUrl: 'menu-bar.component.html',
  styleUrls: ['menu-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuBarComponent {

  // Export to the template
  MenuType = MenuType;

  constructor(
    public layout: LayoutService,
    public login: LoginService,
    public messages: Messages) {
  }

  @Input() activeMenu: ActiveMenu;
}
