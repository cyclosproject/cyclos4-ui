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
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent extends BasePageComponent<DataForFrontendHome> implements OnInit {

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
      if (!this.dataForFrontendHolder.dataForFrontend?.hasHomePage) {
        // No home page! Redirect to login
        this.router.navigate(['/login']);
        return;
      }
      // For guests, we just have content. So, emulate scrolling on d-pad (useful for KaiOS)
      this.emulateKeyboardScroll();
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

  defaultFullWidthLayout(): boolean {
    return this.login.user == null;
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
    return this.login.user == null ? Menu.HOME : Menu.DASHBOARD;
  }
}
