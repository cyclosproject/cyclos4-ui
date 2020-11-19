import { ChangeDetectionStrategy, Component, HostBinding, Injector, Input, OnInit } from '@angular/core';
import { UserResult } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { MenuService } from 'app/ui/core/menu.service';
import { BaseDashboardComponent } from 'app/ui/home/dashboard/base-dashboard.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';

/**
 * Displays the latest users
 */
@Component({
  selector: 'latest-users',
  templateUrl: 'latest-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestUsersComponent extends BaseDashboardComponent implements OnInit {

  @HostBinding('class.dashboard-icon-result') classIconResult = true;

  @Input() users: UserResult[];

  constructor(
    injector: Injector,
    private menu: MenuService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // The heading actions
    this.headingActions = [
      new HeadingAction(SvgIcon.Search, this.i18n.general.view,
        event => this.menu.navigate({
          menu: new ActiveMenu(Menu.SEARCH_USERS),
          clear: false,
          event,
        }),
        true),
    ];
  }

  path(user: UserResult): string {
    return `/users/${user.id}/profile`;
  }

  navigate(user: UserResult, event: MouseEvent) {
    this.menu.navigate({
      url: this.path(user),
      menu: new ActiveMenu(Menu.SEARCH_USERS),
      clear: false,
      event,
    });
  }
}
