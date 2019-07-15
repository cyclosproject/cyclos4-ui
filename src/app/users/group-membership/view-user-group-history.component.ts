import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { GroupMembershipData } from 'app/api/models';
import { GroupMembershipService } from 'app/api/services';
import { UserHelperService } from 'app/core/user-helper.service';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

/**
 * Displays the user group membership history
 */
@Component({
  selector: 'view-user-group-history',
  templateUrl: 'view-user-group-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewUserGroupHistoryComponent extends BaseViewPageComponent<GroupMembershipData> implements OnInit {
  constructor(
    injector: Injector,
    private groupMembershipService: GroupMembershipService,
    private userHelper: UserHelperService) {
    super(injector);
  }

  param: string;

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.groupMembershipService.getGroupMembershipData({ user: this.param, fields: ['user', 'history'] }).subscribe(data => {
      this.data = data;
    }));
  }

  get operator() {
    return this.userHelper.isOperator(this.data.user);
  }

  resolveMenu(data: GroupMembershipData) {
    return this.authHelper.searchUsersMenu(data.user);
  }
}
