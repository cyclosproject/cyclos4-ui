import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { User, UserStatusData } from 'app/api/models';
import { UserStatusService } from 'app/api/services/user-status.service';
import { UserHelperService } from 'app/core/user-helper.service';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

/**
 * Displays the user status history
 */
@Component({
  selector: 'view-user-status-history',
  templateUrl: 'view-user-status-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewUserStatusHistoryComponent extends BaseViewPageComponent<UserStatusData> implements OnInit {
  constructor(
    injector: Injector,
    private userStatusService: UserStatusService,
    public usersHelper: UserHelperService) {
    super(injector);
  }

  param: string;

  get user(): User {
    const user = this.data.user;
    return user.user || user;
  }

  get operator(): User {
    const user = this.data.user;
    return user.user ? user : null;
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.userStatusService.getUserStatus({ user: this.param, fields: ['user', 'history'] }).subscribe(status => {
      this.data = status;
    });
  }
}
