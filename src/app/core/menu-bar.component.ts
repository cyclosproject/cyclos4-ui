import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LoginService } from 'app/core/login.service';
import { I18n } from 'app/i18n/i18n';
import { LayoutService } from 'app/shared/layout.service';
import { MenuType, ActiveMenu } from 'app/shared/menu';

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
    public i18n: I18n) {
  }

  @Input() activeMenu: ActiveMenu;
}
