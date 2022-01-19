import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  DataForFrontendHome, DataForUserPasswords, FrontendContentLayoutEnum,
  FrontendDashboardAccount, PasswordStatusAndActions, PasswordStatusEnum
} from 'app/api/models';
import { FrontendService } from 'app/api/services/frontend.service';
import { BasePageComponent, UpdateTitleFrom } from 'app/ui/shared/base-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { chunk } from 'lodash-es';

export const PasswordStatusNeedingAttention = [
  PasswordStatusEnum.EXPIRED, PasswordStatusEnum.RESET,
  PasswordStatusEnum.PENDING, PasswordStatusEnum.NEVER_CREATED,
];

/**
 * Displays the dashboard page (home for logged users)
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'dashboard',
  templateUrl: 'dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent extends BasePageComponent<DataForFrontendHome> implements OnInit {

  FrontendContentLayoutEnum = FrontendContentLayoutEnum;

  passwords: DataForUserPasswords;
  passwordsNeedingAttention: PasswordStatusAndActions[];
  pendingSecurityAnswer = false;

  accounts: FrontendDashboardAccount[][];

  constructor(
    injector: Injector,
    private frontendService: FrontendService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.login.user == null) {
      // Not logged in. Navigate to the guest home page
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }
    this.addSub(this.frontendService.dataForFrontendHome({
      screenSize: this.layout.screenSize
    }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: DataForFrontendHome) {
    if (data.accounts) {
      const parts = chunk(data.accounts, data.mergeAccounts ? 4 : 1);
      if (data.mergeAccounts && parts.length > 1) {
        // Make sure the last card doesn't have a single account, while others are full
        const last = parts[parts.length - 1];
        const previous = parts[parts.length - 2];
        if (last.length === 1) {
          const removed = previous.splice(previous.length - 1, 1);
          Array.prototype.unshift.apply(last, removed);
        }
      }
      this.accounts = parts;
    }
  }

  updateTitleFrom(): UpdateTitleFrom {
    return 'menu';
  }

  passwordMessage(ps: PasswordStatusAndActions) {
    const type = ps.type.name;
    switch (ps.status) {
      case PasswordStatusEnum.EXPIRED:
        return this.i18n.dashboard.passwords.expired(type);
      case PasswordStatusEnum.RESET:
        return this.i18n.dashboard.passwords.reset(type);
      case PasswordStatusEnum.PENDING:
        return this.i18n.dashboard.passwords.pending(type);
      case PasswordStatusEnum.NEVER_CREATED:
        return this.i18n.dashboard.passwords.neverCreated(type);
    }
  }

  goToPasswords(event: MouseEvent) {
    this.menu.navigate({
      menu: new ActiveMenu(Menu.PASSWORDS),
      event,
      clear: false,
    });
  }

  resolveMenu() {
    return Menu.DASHBOARD;
  }
}
