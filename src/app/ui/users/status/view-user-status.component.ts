import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { UserStatusData, UserStatusEnum } from 'app/api/models';
import { UserStatusService } from 'app/api/services/user-status.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { SvgIcon } from 'app/core/svg-icon';

/**
 * Displays the user status and allows changing the status
 */
@Component({
  selector: 'view-user-status',
  templateUrl: 'view-user-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUserStatusComponent extends BaseViewPageComponent<UserStatusData> implements OnInit {
  constructor(
    injector: Injector,
    private userStatusService: UserStatusService,
    public userHelper: UserHelperService) {
    super(injector);
  }

  param: string;
  form: FormGroup;

  get editable(): boolean {
    return !empty(this.data.possibleNewStatuses);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.userStatusService.getUserStatus({ user: this.param, fields: ['-history'] }).subscribe(status => {
      this.data = status;
    }));
    this.form = this.formBuilder.group({
      status: [null, Validators.required],
      comment: null,
    });
    this.headingActions = [
      new HeadingAction(SvgIcon.Clock, this.i18n.general.viewHistory, () =>
        this.router.navigate(['users', this.param, 'status', 'history']), true),
    ];
  }

  save() {
    validateBeforeSubmit(this.form);
    if (!this.form.valid) {
      return;
    }
    const value = this.form.value;
    const status = value.status as UserStatusEnum;
    let message: string;
    const user = this.data.user;
    const operator = this.userHelper.isOperator(user);
    switch (status) {
      case UserStatusEnum.ACTIVE:
        message = this.i18n.userStatus.confirm.active(user.display);
        break;
      case UserStatusEnum.BLOCKED:
        message = this.i18n.userStatus.confirm.blocked(user.display);
        break;
      case UserStatusEnum.DISABLED:
        message = this.i18n.userStatus.confirm.disabled(user.display);
        break;
      case UserStatusEnum.REMOVED:
        message = this.i18n.userStatus.confirm.removed(user.display);
        break;
      case UserStatusEnum.PURGED:
        message = this.i18n.userStatus.confirm.purged(user.display);
        break;
    }
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
    this.notification.confirm({
      title,
      message,
      callback: () => this.submit(status),
    });
  }

  private submit(status: UserStatusEnum) {
    const user = this.data.user.display;
    this.addSub(this.userStatusService.changeUserStatus({
      user: this.param,
      body: this.form.value,
    }).subscribe(() => {
      let message: string;
      switch (status) {
        case UserStatusEnum.ACTIVE:
          message = this.i18n.userStatus.done.active(user);
          break;
        case UserStatusEnum.BLOCKED:
          message = this.i18n.userStatus.done.blocked(user);
          break;
        case UserStatusEnum.DISABLED:
          message = this.i18n.userStatus.done.disabled(user);
          break;
        case UserStatusEnum.REMOVED:
          message = this.i18n.userStatus.done.removed(user);
          break;
        case UserStatusEnum.PURGED:
          message = this.i18n.userStatus.done.purged(user);
          break;
      }
      this.notification.snackBar(message);
      this.reload();
    }));
  }

  get operator() {
    return this.userHelper.isOperator(this.data.user);
  }

  resolveMenu(data: UserStatusData) {
    return this.menu.searchUsersMenu(data.user);
  }

}
