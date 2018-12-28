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
    this.title$.next(multiple ? this.i18n('Passwords') : this.i18n('Password'));
  }

  actions(password: PasswordStatusAndActions): Action[] {
    const actions: Action[] = [];
    const permissions = password.permissions || {};
    if (permissions.change) {
      actions.push(new Action(this.i18n('Change'), () => {
        this.change(password);
      }));
    }
    if (permissions.changeGenerated) {
      actions.push(new Action(this.i18n('Change'), () => {
        this.changeGenerated(password);
      }));
    }
    if (permissions.unblock) {
      actions.push(new Action(this.i18n('Unblock'), () => {
        this.unblock(password);
      }));
    }
    if (permissions.generate) {
      actions.push(new Action(this.i18n('Activate'), () => {
        this.generate(password);
      }));
    }
    if (permissions.enable) {
      actions.push(new Action(this.i18n('Enable'), () => {
        this.enable(password);
      }));
    }
    if (permissions.disable) {
      actions.push(new Action(this.i18n('Disable'), () => {
        this.disable(password);
      }));
    }
    return actions;
  }

  status(password: PasswordStatusAndActions) {
    switch (password.status) {
      case PasswordStatusEnum.ACTIVE:
        return this.i18n('Active');
      case PasswordStatusEnum.DISABLED:
        return this.i18n('Disabled');
      case PasswordStatusEnum.EXPIRED:
        return this.i18n('Expired');
      case PasswordStatusEnum.INDEFINITELY_BLOCKED:
        return this.i18n('Blocked');
      case PasswordStatusEnum.NEVER_CREATED:
        return this.i18n('Never created');
      case PasswordStatusEnum.PENDING:
        return this.i18n('Pending');
      case PasswordStatusEnum.RESET:
        return this.i18n('Reset');
      case PasswordStatusEnum.TEMPORARILY_BLOCKED:
        return this.i18n('Temporarily blocked');
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
      this.notification.snackBar(this.i18n('Your {{name}} was changed', {
        name: password.type.name
      }));
      this.reload();
    }));
  }

  private generate(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n('Activate'),
      message: this.i18n(`This will activate your {{name}}, and the generated value will be displayed only once. Are you sure?`, {
        name: password.type.name
      }),
      callback: () => this.doGenerate(password)
    });
  }

  private doGenerate(password: PasswordStatusAndActions) {
    this.passwordsService.generatePassword(password.type.id).subscribe(newValue => {
      this.notification.info(this.i18n(`The value for {{name}} is <data>{{value}}</data>.
        <br>Make sure to memorize it, as it won't be displayed again.`, {
          name: password.type.name,
          value: newValue
        }));
      this.reload();
    });
  }

  private changeGenerated(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n('Change'),
      message: this.i18n(`This will generate a new {{name}}, and the value will be displayed only once. Are you sure?`, {
        name: password.type.name
      }),
      passwordInput: this.data.confirmationPasswordInput,
      callback: res => this.doChangeGenerated(password, res.confirmationPassword)
    });
  }

  private doChangeGenerated(password: PasswordStatusAndActions, confirmationPassword: string) {
    this.passwordsService.changeGenerated({
      type: password.type.id,
      confirmationPassword: confirmationPassword
    }).subscribe(newValue => {
      this.notification.info(this.i18n(`The value for {{name}} is <data>{{value}}</data>.
        <br>Make sure to memorize it, as it won't be displayed again.`, {
          name: password.type.name,
          value: newValue
        }));
      this.reload();
    });
  }

  private unblock(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n('Unblock'),
      message: this.i18n(`Are you sure to unblock your {{name}}?`, {
        name: password.type.name
      }),
      callback: () => this.doUnblock(password)
    });
  }

  private doUnblock(password: PasswordStatusAndActions) {
    this.passwordsService.unblockPassword({
      user: ApiHelper.SELF,
      type: password.type.id
    }).subscribe(() => {
      this.notification.snackBar(this.i18n('Your {{name}} was unblocked', {
        name: password.type.name
      }));
      this.reload();
    });
  }

  private enable(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n('Enable'),
      message: this.i18n(`Are you sure to enable your {{name}}?`, {
        name: password.type.name
      }),
      callback: () => this.doEnable(password)
    });
  }

  private doEnable(password: PasswordStatusAndActions) {
    this.passwordsService.enablePassword({
      user: ApiHelper.SELF,
      type: password.type.id
    }).subscribe(() => {
      this.notification.snackBar(this.i18n('Your {{name}} was enabled', {
        name: password.type.name
      }));
      this.reload();
    });
  }

  private disable(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n('Disable'),
      message: this.i18n(`Are you sure to disable your {{name}}?`, {
        name: password.type.name
      }),
      callback: () => this.doDisable(password)
    });
  }

  private doDisable(password: PasswordStatusAndActions) {
    this.passwordsService.disablePassword({
      user: ApiHelper.SELF,
      type: password.type.id
    }).subscribe(() => {
      this.notification.snackBar(this.i18n('Your {{name}} was disabled', {
        name: password.type.name
      }));
      this.reload();
    });
  }
}
