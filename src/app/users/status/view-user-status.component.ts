import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { User, UserStatusData, UserStatusEnum } from 'app/api/models';
import { UserStatusService } from 'app/api/services/user-status.service';
import { UserHelperService } from 'app/core/user-helper.service';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { empty, validateBeforeSubmit } from 'app/shared/helper';
import { FormGroup, Validators } from '@angular/forms';
import { HeadingAction } from 'app/shared/action';

/**
 * Displays the user status and allows changing the status
 */
@Component({
  selector: 'view-user-status',
  templateUrl: 'view-user-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewUserStatusComponent extends BaseViewPageComponent<UserStatusData> implements OnInit {
  constructor(
    injector: Injector,
    private userStatusService: UserStatusService,
    public usersHelper: UserHelperService) {
    super(injector);
  }

  key: string;
  form: FormGroup;

  get user(): User {
    const user = this.data.user;
    return user.user || user;
  }

  get operator(): User {
    const user = this.data.user;
    return user.user ? user : null;
  }

  get editable(): boolean {
    return !empty(this.data.possibleNewStatuses);
  }

  ngOnInit() {
    super.ngOnInit();
    this.key = this.route.snapshot.paramMap.get('key');
    this.addSub(this.userStatusService.getUserStatus({ user: this.key, fields: ['!history'] }).subscribe(status => {
      this.data = status;
    }));
    this.form = this.formBuilder.group({
      status: [null, Validators.required],
      comment: null
    });
    this.headingActions = [
      new HeadingAction('history', this.i18n.general.viewHistory, () =>
        this.router.navigate(['users', 'status', this.key, 'history']), true)
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
    this.notification.confirm({
      title: this.layout.ltsm ? this.i18n.userStatus.mobileTitle.change : this.i18n.userStatus.title.change,
      message: message,
      callback: () => this.submit(status)
    });
  }

  private submit(status: UserStatusEnum) {
    this.addSub(this.userStatusService.changeUserStatus({
      user: this.key,
      body: this.form.value
    }).subscribe(() => {
      let message: string;
      switch (status) {
        case UserStatusEnum.ACTIVE:
          message = this.i18n.userStatus.done.active;
          break;
        case UserStatusEnum.BLOCKED:
          message = this.i18n.userStatus.done.blocked;
          break;
        case UserStatusEnum.DISABLED:
          message = this.i18n.userStatus.done.disabled;
          break;
        case UserStatusEnum.REMOVED:
          message = this.i18n.userStatus.done.removed;
          break;
        case UserStatusEnum.PURGED:
          message = this.i18n.userStatus.done.purged;
          break;
      }
      this.notification.snackBar(message);
      this.reload();
    }));
  }

}
