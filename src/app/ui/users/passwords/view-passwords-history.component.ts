import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DataForUserPasswords, PasswordActionEnum, PasswordLog, PasswordType } from 'app/api/models';
import { PasswordsService } from 'app/api/services/passwords.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';

class PasswordLogRow {
  constructor(
    public type: PasswordType,
    public log: PasswordLog
  ) {
  }
}

@Component({
  selector: 'view-passwords-history',
  templateUrl: 'view-passwords-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPasswordsHistoryComponent extends BaseViewPageComponent<DataForUserPasswords> implements OnInit {

  logs: PasswordLogRow[] = [];

  constructor(
    injector: Injector,
    private passwordsService: PasswordsService) {
    super(injector);
  }

  param: string;

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.passwordsService.getUserPasswordsListData({ user: this.param, fields: ['user', 'passwords'] }).subscribe(data => {
      this.data = data;
    }));


  }

  onDataInitialized(data: DataForUserPasswords) {
    data.passwords?.forEach(p =>
      p.history?.forEach(l =>
        this.logs.push(new PasswordLogRow(p.type, l))
      )
    );
  }

  showActionLabel(row: PasswordLogRow) {
    switch (row.log.action) {
      case PasswordActionEnum.ACTIVATE:
        return this.i18n.password.action.activate;
      case PasswordActionEnum.ALLOW_ACTIVATION:
        return this.i18n.password.action.allowGeneration;
      case PasswordActionEnum.CHANGE:
        return this.i18n.password.action.change;
      case PasswordActionEnum.DISABLE:
        return this.i18n.password.action.disable;
      case PasswordActionEnum.ENABLE:
        return this.i18n.password.action.enable;
      case PasswordActionEnum.RESET:
        return this.i18n.password.action.resetGenerated;
      case PasswordActionEnum.RESET_AND_SEND:
        return this.i18n.password.action.resetAndSend;
      case PasswordActionEnum.UNBLOCK:
        return this.i18n.password.action.unblock
    }
  }

  get onClick() {
    // No op condition to disable built-in click (mobile layout)
    return (row: any) => row != null;
  }

  resolveMenu(data: DataForUserPasswords) {
    return this.menu.searchUsersMenu(data.user);
  }
}
