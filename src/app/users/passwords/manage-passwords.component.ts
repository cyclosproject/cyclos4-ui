import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DataForUserPasswords, PasswordStatusAndActions, PasswordStatusEnum } from 'app/api/models';
import { PasswordsService } from 'app/api/services';
import { Action } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent } from 'app/shared/base-page.component';
import { ChangePasswordDialogComponent } from 'app/users/passwords/change-password-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

/**
 * Manages the user passwords
 */
@Component({
  selector: 'manage-passwords',
  templateUrl: 'manage-passwords.component.html',
  styleUrls: ['manage-passwords.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagePasswordsComponent
  extends BasePageComponent<DataForUserPasswords>
  implements OnInit {

  multiple$ = new BehaviorSubject(false);
  title$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private passwordsService: PasswordsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.passwordsService.getUserPasswordsListData({ user: ApiHelper.SELF })
      .subscribe(data => {
        this.data = data;
      });
  }

  onDataInitialized(data: DataForUserPasswords) {
    const multiple = data.passwords.length > 1;
    this.multiple$.next(multiple);
    this.title$.next(multiple ?
      this.messages.auth.password.title.manageMultiple :
      this.messages.auth.password.title.manageSingle);
  }

  actions(password: PasswordStatusAndActions): Action[] {
    const actions: Action[] = [];
    const permissions = password.permissions || {};
    if (permissions.change) {
      actions.push(new Action(this.messages.auth.password.action.change, () => {
        this.change(password);
      }));
    }
    if (permissions.changeGenerated) {
      actions.push(new Action(this.messages.auth.password.action.change, () => {
        this.changeGenerated(password);
      }));
    }
    if (permissions.unblock) {
      actions.push(new Action(this.messages.auth.password.action.unblock, () => {
        this.unblock(password);
      }));
    }
    if (permissions.generate) {
      actions.push(new Action(this.messages.auth.password.action.activate, () => {
        this.generate(password);
      }));
    }
    if (permissions.enable) {
      actions.push(new Action(this.messages.auth.password.action.enable, () => {
        this.enable(password);
      }));
    }
    if (permissions.disable) {
      actions.push(new Action(this.messages.auth.password.action.disable, () => {
        this.disable(password);
      }));
    }
    return actions;
  }

  status(password: PasswordStatusAndActions) {
    switch (password.status) {
      case PasswordStatusEnum.ACTIVE:
        return this.messages.auth.password.status.active;
      case PasswordStatusEnum.DISABLED:
        return this.messages.auth.password.status.disabled;
      case PasswordStatusEnum.EXPIRED:
        return this.messages.auth.password.status.expired;
      case PasswordStatusEnum.INDEFINITELY_BLOCKED:
        return this.messages.auth.password.status.indefinitelyBlocked;
      case PasswordStatusEnum.NEVER_CREATED:
        return this.messages.auth.password.status.neverCreated;
      case PasswordStatusEnum.PENDING:
        return this.messages.auth.password.status.pending;
      case PasswordStatusEnum.RESET:
        return this.messages.auth.password.status.reset;
      case PasswordStatusEnum.TEMPORARILY_BLOCKED:
        return this.messages.auth.password.status.temporarilyBlocked;
    }
  }

  private change(password: PasswordStatusAndActions) {
    const ref = this.modal.show(ChangePasswordDialogComponent, {
      class: 'modal-form',
      initialState: {
        type: password.type,
        requireOld: password.requireOldPasswordForChange
      }
    });
    const component = ref.content as ChangePasswordDialogComponent;
    this.addSub(component.done.subscribe(() => {
      this.notification.snackBar(this.messages.auth.password.action.changeDone(password.type.name));
      this.reload();
    }));
  }

  private generate(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.messages.auth.password.action.activate,
      message: this.messages.auth.password.action.activateConfirm(password.type.name),
      callback: () => this.doGenerate(password)
    });
  }

  private doGenerate(password: PasswordStatusAndActions) {
    this.passwordsService.generatePassword(password.type.id).subscribe(newValue => {
      this.notification.info(this.messages.auth.password.action.changeGeneratedDone({
        type: password.type.name,
        value: newValue
      }));
      this.reload();
    });
  }

  private changeGenerated(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.messages.auth.password.action.change,
      message: this.messages.auth.password.action.changeGeneratedConfirm(password.type.name),
      passwordInput: this.data.confirmationPasswordInput,
      callback: res => this.doChangeGenerated(password, res.confirmationPassword)
    });
  }

  private doChangeGenerated(password: PasswordStatusAndActions, confirmationPassword: string) {
    this.passwordsService.changeGenerated({
      type: password.type.id,
      confirmationPassword: confirmationPassword
    }).subscribe(newValue => {
      this.notification.info(
        this.messages.auth.password.action.changeGeneratedDone({
          type: password.type.name,
          value: newValue
        }));
      this.reload();
    });
  }

  private unblock(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.messages.auth.password.action.unblock,
      message: this.messages.auth.password.action.unblockConfirm(password.type.name),
      callback: () => this.doUnblock(password)
    });
  }

  private doUnblock(password: PasswordStatusAndActions) {
    this.passwordsService.unblockPassword({
      user: ApiHelper.SELF,
      type: password.type.id
    }).subscribe(() => {
      this.notification.snackBar(this.messages.auth.password.action.unblockDone(password.type.name));
      this.reload();
    });
  }

  private enable(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.messages.auth.password.action.enable,
      message: this.messages.auth.password.action.enableConfirm(password.type.name),
      callback: () => this.doEnable(password)
    });
  }

  private doEnable(password: PasswordStatusAndActions) {
    this.passwordsService.enablePassword({
      user: ApiHelper.SELF,
      type: password.type.id
    }).subscribe(() => {
      this.notification.snackBar(this.messages.auth.password.action.enableDone(password.type.name));
      this.reload();
    });
  }

  private disable(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.messages.auth.password.action.disable,
      message: this.messages.auth.password.action.disableConfirm(password.type.name),
      callback: () => this.doDisable(password)
    });
  }

  private doDisable(password: PasswordStatusAndActions) {
    this.passwordsService.disablePassword({
      user: ApiHelper.SELF,
      type: password.type.id
    }).subscribe(() => {
      this.notification.snackBar(this.messages.auth.password.action.disableDone(password.type.name));
      this.reload();
    });
  }
}
