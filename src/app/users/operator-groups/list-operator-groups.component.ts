import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserOperatorGroupsListData, EntityReference } from 'app/api/models';
import { OperatorGroupsService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { HeadingAction } from 'app/shared/action';

/**
 * Operator groups list
 */
@Component({
  selector: 'list-operator-groups',
  templateUrl: 'list-operator-groups.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListOperatorGroupsComponent
  extends BasePageComponent<UserOperatorGroupsListData>
  implements OnInit {

  key: string;
  self: boolean;
  groups: EntityReference[];

  constructor(
    injector: Injector,
    private operatorGroupsService: OperatorGroupsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.key = this.route.snapshot.paramMap.get('key') || this.ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.key);

    this.addSub(this.operatorGroupsService.getUserOperatorGroupsListData({ user: this.key }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: UserOperatorGroupsListData) {
    this.groups = data.operatorGroups;
    if (data.canCreate) {
      this.headingActions = [
        new HeadingAction('add', this.i18n.general.addNew, () => {
          const path = ['users'];
          if (!this.self) {
            path.push(this.key);
          }
          path.push('operator-groups');
          path.push('create');
          this.router.navigate(path);
        }, true)
      ];
    }
  }

  path(group: EntityReference) {
    return ['users', 'operator-groups', group.id];
  }

  get toLink() {
    return (group: EntityReference) => this.path(group);
  }

  remove(group: EntityReference) {
    this.notification.confirm({
      message: this.i18n.general.removeConfirm(group.name),
      callback: () => this.doRemove(group)
    });
  }

  private doRemove(group: EntityReference) {
    this.addSub(this.operatorGroupsService.deleteOperatorGroup({ id: group.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(group.name));
      this.reload();
    }));
  }
}
