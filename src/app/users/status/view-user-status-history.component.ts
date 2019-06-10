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

  key: string;

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
    this.key = this.route.snapshot.paramMap.get('key');
    this.userStatusService.getUserStatus({ user: this.key, fields: ['user', 'history'] }).subscribe(status => {
      this.data = status;
    });
  }
}
