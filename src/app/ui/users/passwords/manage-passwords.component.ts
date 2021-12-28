import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import {
  CreateDeviceConfirmation, DataForUserPasswords, DeviceConfirmationTypeEnum,
  PasswordStatusAndActions, PasswordStatusEnum, SendMediumEnum,
} from 'app/api/models';
import { PasswordsService } from 'app/api/services/passwords.service';
import { Action } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';
import { ChangePasswordDialogComponent } from 'app/ui/users/passwords/change-password-dialog.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { NextRequestState } from 'app/core/next-request-state';

/**
 * Manages the user passwords
 */
@Component({
  selector: 'manage-passwords',
  templateUrl: 'manage-passwords.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagePasswordsComponent
  extends BasePageComponent<DataForUserPasswords>
  implements OnInit {

  param: string;
  self: boolean;

  multiple: boolean;
  title: string;
  mobileTitle: string;

  securityAnswer: FormGroup;

  constructor(
    injector: Injector,
    private modal: BsModalService,
    private passwordsService: PasswordsService,
    private nextRequestState: NextRequestState) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.passwordsService.getUserPasswordsListData({ user: this.param })
      .subscribe(data => {
        this.data = data;
      }));
  }

  onDataInitialized(data: DataForUserPasswords) {
    this.self = this.authHelper.isSelf(data.user);
    this.multiple = data.passwords.length > 1;
    if (this.self) {
      this.title = this.multiple
        ? this.i18n.password.title.manageMultipleSelf
        : this.i18n.password.title.manageSingleSelf;
      this.mobileTitle = this.multiple
        ? this.i18n.password.mobileTitle.manageMultipleSelf
        : this.i18n.password.mobileTitle.manageSingleSelf;
    } else {
      this.title = this.multiple
        ? this.i18n.password.title.manageMultipleUser
        : this.i18n.password.title.manageSingleUser;
      this.mobileTitle = this.multiple
        ? this.i18n.password.mobileTitle.manageMultipleUser
        : this.i18n.password.mobileTitle.manageSingleUser;
    }

    if (data.dataForSetSecurityAnswer) {
      this.securityAnswer = this.formBuilder.group({
        securityQuestion: [null, Validators.required],
        securityAnswer: [null, Validators.required],
      });
    }
  }

  actions(password: PasswordStatusAndActions): Action[] {
    const actions: Action[] = [];
    const permissions = password.permissions || {};
    if (permissions.change) {
      actions.push(new Action(this.i18n.password.action.change, () => {
        this.change(password);
      }));
    }
    if (permissions.changeGenerated) {
      actions.push(new Action(this.i18n.password.action.change, () => {
        this.changeGenerated(password);
      }));
    }
    if (permissions.allowGeneration) {
      actions.push(new Action(this.i18n.password.action.allowGeneration, () => {
        this.allowGeneration(password);
      }));
    }
    if (permissions.resetAndSend) {
      if (this.data.sendMediums.includes(SendMediumEnum.EMAIL)) {
        actions.push(new Action(this.i18n.password.action.resetAndSendEmail, () => {
          this.resetAndSend(password, SendMediumEnum.EMAIL);
        }));
      }
      if (this.data.sendMediums.includes(SendMediumEnum.SMS)) {
        actions.push(new Action(this.i18n.password.action.resetAndSendSms, () => {
          this.resetAndSend(password, SendMediumEnum.SMS);
        }));
      }
    }
    if (permissions.resetGenerated) {
      actions.push(new Action(this.i18n.password.action.resetGenerated, () => {
        this.resetGenerated(password);
      }));
    }
    if (permissions.unblock) {
      actions.push(new Action(this.i18n.password.action.unblock, () => {
        this.unblock(password);
      }));
    }
    if (permissions.generate) {
      actions.push(new Action(this.i18n.password.action.activate, () => {
        this.generate(password);
      }));
    }
    if (permissions.enable) {
      actions.push(new Action(this.i18n.password.action.enable, () => {
        this.enable(password);
      }));
    }
    if (permissions.disable) {
      actions.push(new Action(this.i18n.password.action.disable, () => {
        this.disable(password);
      }));
    }
    return actions;
  }

  setSecurityAnswer() {
    validateBeforeSubmit(this.securityAnswer);
    if (!this.securityAnswer.valid) {
      return;
    }
    this.addSub(this.passwordsService.setSecurityAnswer({ body: this.securityAnswer.value }).subscribe(() => {
      this.notification.snackBar(this.i18n.securityQuestion.set);
      this.reload();
    }));
  }

  status(password: PasswordStatusAndActions) {
    switch (password.status) {
      case PasswordStatusEnum.ACTIVE:
        return this.i18n.password.status.active;
      case PasswordStatusEnum.DISABLED:
        return this.i18n.password.status.disabled;
      case PasswordStatusEnum.EXPIRED:
        return this.i18n.password.status.expired;
      case PasswordStatusEnum.INDEFINITELY_BLOCKED:
        return this.i18n.password.status.indefinitelyBlocked;
      case PasswordStatusEnum.NEVER_CREATED:
        return this.i18n.password.status.neverCreated;
      case PasswordStatusEnum.PENDING:
        return this.i18n.password.status.pending;
      case PasswordStatusEnum.RESET:
        return this.i18n.password.status.reset;
      case PasswordStatusEnum.TEMPORARILY_BLOCKED:
        return this.i18n.password.status.temporarilyBlocked;
    }
  }

  private change(password: PasswordStatusAndActions) {
    const ref = this.modal.show(ChangePasswordDialogComponent, {
      class: 'modal-form',
      initialState: {
        param: this.param,
        type: password.type,
        user: this.data.user,
        requireOld: password.requireOldPasswordForChange,
      },
    });
    const component = ref.content as ChangePasswordDialogComponent;
    this.addSub(component.done.subscribe(() => {
      this.notification.snackBar(this.i18n.password.action.changeDone(password.type.name));
      this.reload();
    }));
  }

  private generate(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n.password.action.activate,
      message: this.i18n.password.action.activateConfirm(password.type.name),
      callback: () => this.doGenerate(password),
    });
  }

  private doGenerate(password: PasswordStatusAndActions) {
    this.addSub(this.passwordsService.generatePassword({ type: password.type.id }).subscribe(newValue => {
      this.nextRequestState.leaveNotification = true;
      this.notification.info(this.i18n.password.action.changeGeneratedDone({
        type: password.type.name,
        value: newValue,
      }));
      this.reload();
    }));
  }

  private createDeviceConfirmation(password: PasswordStatusAndActions): () => CreateDeviceConfirmation {
    return () => ({
      type: DeviceConfirmationTypeEnum.GENERATE_PASSWORD,
      passwordType: password.type.id,
    });
  }

  private changeGenerated(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n.password.action.change,
      message: this.i18n.password.action.changeGeneratedConfirm(password.type.name),
      createDeviceConfirmation: this.createDeviceConfirmation(password),
      passwordInput: this.data.confirmationPasswordInput,
      callback: res => this.doChangeGenerated(password, res.confirmationPassword),
    });
  }

  private doChangeGenerated(password: PasswordStatusAndActions, confirmationPassword: string) {
    this.addSub(this.passwordsService.changeGenerated({
      type: password.type.id,
      confirmationPassword,
    }).subscribe(newValue => {
      this.nextRequestState.leaveNotification = true;
      this.notification.info(
        this.i18n.password.action.changeGeneratedDone({
          type: password.type.name,
          value: newValue,
        }));
      this.reload();
    }));
  }

  private allowGeneration(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n.password.action.allowGeneration,
      message: this.i18n.password.action.allowGenerationConfirm(password.type.name),
      callback: () => this.doAllowGeneration(password),
    });
  }

  private doAllowGeneration(password: PasswordStatusAndActions) {
    this.addSub(this.passwordsService.allowGeneration({
      type: password.type.id,
      user: this.param,
    }).subscribe(() => {
      this.notification.snackBar(
        this.i18n.password.action.allowGenerationDone(password.type.name));
      this.reload();
    }));
  }

  private resetGenerated(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n.password.action.resetGenerated,
      message: this.i18n.password.action.resetGeneratedConfirm(password.type.name),
      callback: () => this.doResetGenerated(password),
    });
  }

  private doResetGenerated(password: PasswordStatusAndActions) {
    this.addSub(this.passwordsService.resetGeneratedPassword({
      type: password.type.id,
      user: this.param,
    }).subscribe(() => {
      this.notification.snackBar(
        this.i18n.password.action.resetGeneratedDone(password.type.name));
      this.reload();
    }));
  }

  private resetAndSend(password: PasswordStatusAndActions, medium: SendMediumEnum) {
    let title: string;
    let message: string;
    switch (medium) {
      case SendMediumEnum.EMAIL:
        title = this.i18n.password.action.resetAndSendEmail;
        message = this.i18n.password.action.resetAndSendEmailConfirm(password.type.name);
        break;
      case SendMediumEnum.SMS:
        title = this.i18n.password.action.resetAndSendSms;
        message = this.i18n.password.action.resetAndSendSmsConfirm(password.type.name);
        break;
    }
    this.notification.confirm({
      title,
      message,
      callback: () => this.doResetAndSend(password, medium),
    });
  }

  private doResetAndSend(password: PasswordStatusAndActions, medium: SendMediumEnum) {
    this.addSub(this.passwordsService.resetAndSendPassword({
      type: password.type.id,
      sendMediums: [medium],
      user: this.param,
    }).subscribe(() => {
      switch (medium) {
        case SendMediumEnum.EMAIL:
          this.notification.snackBar(
            this.i18n.password.action.resetAndSendEmailDone(password.type.name));
          break;
        case SendMediumEnum.SMS:
          this.notification.snackBar(
            this.i18n.password.action.resetAndSendSmsDone(password.type.name));
          break;
      }
      this.reload();
    }));
  }

  private unblock(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n.password.action.unblock,
      message: this.i18n.password.action.unblockConfirm(password.type.name),
      callback: () => this.doUnblock(password),
    });
  }

  private doUnblock(password: PasswordStatusAndActions) {
    this.addSub(this.passwordsService.unblockPassword({
      user: this.param,
      type: password.type.id,
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.password.action.unblockDone(password.type.name));
      this.reload();
    }));
  }

  private enable(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n.password.action.enable,
      message: this.i18n.password.action.enableConfirm(password.type.name),
      callback: () => this.doEnable(password),
    });
  }

  private doEnable(password: PasswordStatusAndActions) {
    this.addSub(this.passwordsService.enablePassword({
      user: this.param,
      type: password.type.id,
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.password.action.enableDone(password.type.name));
      this.reload();
    }));
  }

  private disable(password: PasswordStatusAndActions) {
    this.notification.confirm({
      title: this.i18n.password.action.disable,
      message: this.i18n.password.action.disableConfirm(password.type.name),
      callback: () => this.doDisable(password),
    });
  }

  private doDisable(password: PasswordStatusAndActions) {
    this.addSub(this.passwordsService.disablePassword({
      user: this.param,
      type: password.type.id,
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.password.action.disableDone(password.type.name));
      this.reload();
    }));
  }

  resolveMenu(data: DataForUserPasswords) {
    return this.menu.userMenu(data.user, Menu.PASSWORDS);
  }
}
