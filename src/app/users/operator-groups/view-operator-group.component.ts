import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { EntityReference, OperatorGroupView, UserOperatorGroupsListData } from 'app/api/models';
import { OperatorGroupsService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

/**
 * Operator group view
 */
@Component({
  selector: 'view-operator-group',
  templateUrl: 'view-operator-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewOperatorGroupComponent
  extends BaseViewPageComponent<OperatorGroupView>
  implements OnInit {

  id: string;
  self: boolean;
  groups: EntityReference[];

  constructor(
    injector: Injector,
    private operatorGroupsService: OperatorGroupsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.paramMap.get('id');

    this.addSub(this.operatorGroupsService.viewOperatorGroup({ id: this.id }).subscribe(data => {
      this.data = data;
    }));
  }

  get group(): OperatorGroupView {
    return this.data;
  }

  onDataInitialized(group: OperatorGroupView) {
    if (group.editable) {
      this.headingActions = [
        new HeadingAction('clear', this.i18n.general.remove, () => this.remove())
      ];
    }
  }

  remove() {
    this.notification.confirm({
      message: this.i18n.general.removeConfirm(this.group.name),
      callback: () => this.doRemove()
    });
  }

  private doRemove() {
    this.addSub(this.operatorGroupsService.deleteOperatorGroup({ id: this.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(this.group.name));
      this.router.navigate(['users', this.authHelper.orSelf(this.group.user), 'operator-groups']);
    }));
  }
}
