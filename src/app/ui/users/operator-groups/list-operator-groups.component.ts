import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { EntityReference, UserOperatorGroupsListData } from 'app/api/models';
import { OperatorGroupsService } from 'app/api/services/operator-groups.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * Operator groups list
 */
@Component({
  selector: 'list-operator-groups',
  templateUrl: 'list-operator-groups.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListOperatorGroupsComponent
  extends BasePageComponent<UserOperatorGroupsListData>
  implements OnInit {

  param: string;
  self: boolean;
  groups: EntityReference[];

  constructor(
    injector: Injector,
    private operatorGroupsService: OperatorGroupsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || this.ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.param);

    this.addSub(this.operatorGroupsService.getUserOperatorGroupsListData({ user: this.param }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: UserOperatorGroupsListData) {
    this.groups = data.operatorGroups;
    if (data.canCreate) {
      this.headingActions = [
        new HeadingAction(SvgIcon.PlusCircle, this.i18n.general.addNew, () => {
          this.router.navigate(['/users', this.param, 'operator-groups', 'new']);
        }, true),
      ];
    }
  }

  path(group: EntityReference) {
    return ['/users', 'operator-groups', group.id];
  }

  get toLink() {
    return (group: EntityReference) => this.path(group);
  }

  remove(group: EntityReference) {
    this.notification.confirm({
      message: this.i18n.general.removeConfirm(group.name),
      callback: () => this.doRemove(group),
    });
  }

  private doRemove(group: EntityReference) {
    this.addSub(this.operatorGroupsService.deleteOperatorGroup({ id: group.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(group.name));
      this.reload();
    }));
  }

  resolveMenu(data: UserOperatorGroupsListData) {
    return this.menu.userMenu(data.user, Menu.OPERATOR_GROUPS);
  }
}
