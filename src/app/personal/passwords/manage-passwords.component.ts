import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { PasswordsService } from 'app/api/services';
import { DataForUserPasswords, PasswordStatusAndActions, PasswordStatusEnum } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { Action } from 'app/shared/action';
import { MatDialog } from '@angular/material';
import { ChangePasswordFormComponent } from 'app/personal/passwords/change-password-form.component';

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
    if (permissions.generate) {
      actions.push(new Action('get_app', this.messages.passwordGenerate(), () => {
        this.generate(password);
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
    this.dialog.open(ChangePasswordFormComponent, this.layout.formDialogConfig(password.type)).afterClosed().subscribe(saved => {
      if (saved) {
        this.notification.snackBar(this.messages.passwordChangeDone(password.type.name));
        this.reload();
      }
    });
  }

  private generate(password: PasswordStatusAndActions) {
    this.notification.yesNo(this.messages.passwordGenerateConfirmation(password.type.name)).subscribe(answer => {
      if (answer) {
        this.passwordsService.generatePassword(password.type.id).subscribe(newValue => {
          const tag = `<span class="generated-password">${newValue}</span>`;
          this.notification.info(this.messages.passwordGenerateDone(password.type.name, tag));
          this.reload();
        });
      }
    });
  }

  private changeGenerated(password: PasswordStatusAndActions) {
    if (this.data.confirmationPasswordInput) {
      this.notification.confirmWithPassword(this.messages.passwordChangeGeneratedConfirmation(password.type.name),
        this.data.confirmationPasswordInput).subscribe(confirmationPassword => {
          this.doChangeGenerated(password, confirmationPassword);
        });
    } else {
      this.notification.yesNo(this.messages.passwordChangeGeneratedConfirmation(password.type.name)).subscribe(answer => {
        if (answer) {
          this.doChangeGenerated(password);
        }
      });
    }
  }

  private doChangeGenerated(password: PasswordStatusAndActions, confirmationPassword?: string) {
    this.passwordsService.changeGenerated({
      type: password.type.id,
      confirmationPassword: confirmationPassword
    }).subscribe(newValue => {
      const tag = `<span class="generated-password">${newValue}</span>`;
      this.notification.info(this.messages.passwordChangeGeneratedDone(password.type.name, tag));
      this.reload();
    });
  }

  private unblock(password: PasswordStatusAndActions) {
    this.notification.yesNo(this.messages.passwordUnblockConfirmation(password.type.name)).subscribe(answer => {
      if (answer) {
        this.passwordsService.unblockPassword({
          user: ApiHelper.SELF,
          type: password.type.id
        }).subscribe(() => {
          this.notification.snackBar(this.messages.passwordUnblockDone(password.type.name));
          this.reload();
        });
      }
    });
  }

  private enable(password: PasswordStatusAndActions) {
    this.notification.yesNo(this.messages.passwordEnableConfirmation(password.type.name)).subscribe(answer => {
      if (answer) {
        this.passwordsService.enablePassword({
          user: ApiHelper.SELF,
          type: password.type.id
        }).subscribe(() => {
          this.notification.snackBar(this.messages.passwordEnableDone(password.type.name));
          this.reload();
        });
      }
    });
  }

  private disable(password: PasswordStatusAndActions) {
    this.notification.yesNo(this.messages.passwordDisableConfirmation(password.type.name)).subscribe(answer => {
      if (answer) {
        this.passwordsService.disablePassword({
          user: ApiHelper.SELF,
          type: password.type.id
        }).subscribe(() => {
          this.notification.snackBar(this.messages.passwordDisableDone(password.type.name));
          this.reload();
        });
      }
    });
  }

  private reload() {
    this.loaded.next(false);
    this.ngOnInit();
  }
}
