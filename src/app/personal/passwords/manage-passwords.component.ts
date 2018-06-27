import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { PasswordsService } from 'app/api/services';
import { DataForUserPasswords, PasswordStatusAndActions, PasswordStatusEnum } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { Action } from 'app/shared/action';
import { MatDialog } from '@angular/material';

/**
 * Manages the passwords of a user.
 */
@Component({
  selector: 'manage-passwords',
  templateUrl: 'manage-passwords.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagePasswordsComponent extends BaseComponent {

  loaded = new BehaviorSubject(false);
  data: DataForUserPasswords;

  constructor(
    injector: Injector,
    private dialog: MatDialog,
    private passwordsService: PasswordsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.passwordsService.getUserPasswordsListData({ user: ApiHelper.SELF })
      .subscribe(data => {
        this.data = data;
        this.loaded.next(true);
      });
  }

  actions(password: PasswordStatusAndActions): Action[] {
    const actions: Action[] = [];
    const permissions = password.permissions || {};
    if (permissions.change) {
      actions.push(new Action('edit', this.messages.passwordChange(), () => {
        this.change(password);
      }));
    }
    if (permissions.changeGenerated) {
      actions.push(new Action('edit', this.messages.passwordChange(), () => {
        this.changeGenerated(password);
      }));
    }
    if (permissions.unblock) {
      actions.push(new Action('lock_open', this.messages.passwordUnblock(), () => {
        this.unblock(password);
      }));
    }
    if (permissions.resetGenerated) {
      actions.push(new Action('autorenew', this.messages.passwordReset(), () => {
        this.resetGenerated(password);
      }));
    }
    if (permissions.resetAndSend) {
      actions.push(new Action('autorenew', this.messages.passwordReset(), () => {
        this.resetAndSend(password);
      }));
    }
    if (permissions.generate) {
      actions.push(new Action('get_app', this.messages.passwordGenerate(), () => {
        this.resetAndSend(password);
      }));
    }
    if (permissions.enable) {
      actions.push(new Action('check_circle_outline', this.messages.passwordEnable(), () => {
        this.enable(password);
      }));
    }
    if (permissions.disable) {
      actions.push(new Action('block', this.messages.passwordDisable(), () => {
        this.disable(password);
      }));
    }
    return actions;
  }

  status(password: PasswordStatusAndActions) {
    switch (password.status) {
      case PasswordStatusEnum.ACTIVE:
        return this.messages.passwordStatusActive();
      case PasswordStatusEnum.DISABLED:
        return this.messages.passwordStatusDisabled();
      case PasswordStatusEnum.EXPIRED:
        return this.messages.passwordStatusExpired();
      case PasswordStatusEnum.INDEFINITELY_BLOCKED:
        return this.messages.passwordStatusIndefinitelyBlocked();
      case PasswordStatusEnum.NEVER_CREATED:
        return this.messages.passwordStatusNeverCreated();
      case PasswordStatusEnum.PENDING:
        return this.messages.passwordStatusPending();
      case PasswordStatusEnum.RESET:
        return this.messages.passwordStatusReset();
      case PasswordStatusEnum.TEMPORARILY_BLOCKED:
        return this.messages.passwordStatusTemporarilyBlocked();
    }
  }

  private change(password: PasswordStatusAndActions) {
    this.notification.warning('Not implemented yet!');
  }

  private changeGenerated(password: PasswordStatusAndActions) {
    this.notification.warning('Not implemented yet!');
  }

  private unblock(password: PasswordStatusAndActions) {
    this.notification.warning('Not implemented yet!');
  }

  private resetGenerated(password: PasswordStatusAndActions) {
    this.notification.warning('Not implemented yet!');
  }

  private resetAndSend(password: PasswordStatusAndActions) {
    this.notification.warning('Not implemented yet!');
  }

  private enable(password: PasswordStatusAndActions) {
    this.notification.warning('Not implemented yet!');
  }

  private disable(password: PasswordStatusAndActions) {
    this.notification.warning('Not implemented yet!');
  }

  /*
  private remove(password: PasswordResult) {
    this.passwordsService.getPasswordInputForRemovePassword({ id: password.id }).subscribe(passwordInput => {
      if (passwordInput == null) {
        // No confirmation password is required: just as yes / no
        this.notification.yesNo(this.messages.passwordRemove(password.name))
          .subscribe(answer => {
            if (answer) {
              this.doRemove(password);
            }
          });
      } else {
        // Need to confirm with a password
        this.notification.confirmWithPassword(
          this.messages.passwordRemove(password.name),
          passwordInput,
          this.messages.phoneConfirmationPassword())
          .subscribe(confirmationPassword => {
            if (confirmationPassword) {
              this.doRemove(password, confirmationPassword);
            }
          });
      }
    });
  }

  private doRemove(password: PasswordResult, confirmationPassword: string = null) {
    this.passwordsService.deletePassword({
      id: password.id,
      confirmationPassword: confirmationPassword
    }).subscribe(() => {
      this.notification.snackBar(this.messages.passwordRemoved());
      this.reload();
    });
  }

  private edit(password: PasswordResult) {
    this.passwordsService.getPasswordDataForEdit({
      id: password.id
    }).subscribe(forEdit => {
      forEdit['id'] = password.id;
      this.dialog.open(PasswordFormComponent, this.layout.formDialogConfig(forEdit)).afterClosed().subscribe(saved => {
        if (saved) {
          this.notification.snackBar(this.messages.passwordModified());
          this.reload();
        }
      });
    });
  }
  */

  private reload() {
    this.loaded.next(false);
    this.ngOnInit();
  }
}
