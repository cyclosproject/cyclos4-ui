import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { GroupMembershipData } from 'app/api/models/group-membership-data';
import { GroupMembershipService } from 'app/api/services/group-membership.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { UserHelperService } from 'app/core/user-helper.service';

/**
 * Displays the user group membership and allows changing the group
 */
@Component({
  selector: 'view-user-group',
  templateUrl: 'view-user-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewUserGroupComponent extends BaseViewPageComponent<GroupMembershipData> implements OnInit {
  constructor(
    injector: Injector,
    private userHelper: UserHelperService,
    private groupMembershipService: GroupMembershipService) {
    super(injector);
  }

  param: string;
  self: boolean;
  form: FormGroup;
  allowEmptyGroup: boolean;

  get editable(): boolean {
    return !empty(this.data.possibleNewGroups);
  }

  get operator() {
    return this.userHelper.isOperator(this.data.user);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.groupMembershipService.getGroupMembershipData({ user: this.param, fields: ['-history'] }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: GroupMembershipData) {
    // Operators can have an empty group - they are alias operators
    this.allowEmptyGroup = this.userHelper.isOperator(data.user) && !!data.group;
    this.form = this.formBuilder.group({
      group: this.allowEmptyGroup ? null : [null, Validators.required],
      comment: null
    });
    this.headingActions = [
      new HeadingAction('history', this.i18n.general.viewHistory, () =>
        this.router.navigate(['users', this.param, 'group', 'history']), true)
    ];
  }

  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    const group = this.data.possibleNewGroups.find(g => g.id === this.form.value.group);
    const operator = this.userHelper.isOperator(this.data.user);
    let title: string;
    if (operator) {
      title = this.layout.ltsm
        ? this.i18n.userStatus.mobileTitle.changeOperator
        : this.i18n.userStatus.title.changeOperator;
    } else {
      title = this.layout.ltsm
        ? this.i18n.userStatus.mobileTitle.changeUser
        : this.i18n.userStatus.title.changeUser;
    }
    let message: string;
    if (group) {
      message = this.i18n.groupMembership.confirm({
        user: this.data.user.display,
        group: group ? group.name : this.i18n.user.operatorNoGroup
      });
    } else {
      message = this.i18n.groupMembership.confirmAliasOperator(this.data.user.display);
    }
    this.notification.confirm({
      title: title,
      message: message,
      callback: () => this.submit()
    });
  }

  private submit() {
    this.addSub(this.groupMembershipService.changeGroupMembership({
      user: this.param,
      body: this.form.value
    }).subscribe(() => {
      const message = this.operator
        ? this.i18n.groupMembership.doneOperator
        : this.i18n.groupMembership.doneUser;
      this.notification.snackBar(message);
      this.reload();
    }));
  }

}
