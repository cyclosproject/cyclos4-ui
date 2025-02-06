import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AdKind,
  DataForFrontendHome,
  DataForUserPasswords,
  FrontendContentLayoutEnum,
  FrontendDashboardAccount,
  PasswordStatusAndActions,
  PasswordStatusEnum,
  QuickAccessTypeEnum,
  RoleEnum,
  UserMenuEnum
} from 'app/api/models';
import { FrontendService } from 'app/api/services/frontend.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { QuickAccessHelperService } from 'app/ui/core/quick-access-helper.service';
import { RunOperationHelperService } from 'app/ui/core/run-operation-helper.service';
import { QuickAccessAction } from 'app/ui/dashboard/quick-access-action';
import { BasePageComponent, UpdateTitleFrom } from 'app/ui/shared/base-page.component';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { environment } from 'environments/environment';
import { chunk } from 'lodash-es';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const PasswordStatusNeedingAttention = [
  PasswordStatusEnum.EXPIRED,
  PasswordStatusEnum.RESET,
  PasswordStatusEnum.PENDING,
  PasswordStatusEnum.NEVER_CREATED
];

/**
 * Displays the dashboard page (home for logged users)
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'dashboard',
  templateUrl: 'dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent extends BasePageComponent<DataForFrontendHome> implements OnInit {
  FrontendContentLayoutEnum = FrontendContentLayoutEnum;

  passwords: DataForUserPasswords;
  passwordsNeedingAttention: PasswordStatusAndActions[];
  pendingSecurityAnswer = false;

  actions: QuickAccessAction[];
  accounts: FrontendDashboardAccount[][];

  constructor(
    injector: Injector,
    private frontendService: FrontendService,
    private quickAccessHelper: QuickAccessHelperService,
    private iconLoadingService: IconLoadingService,
    private runOperationHelper: RunOperationHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    if (this.login.user == null) {
      // Not logged in. Navigate to the guest home page
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }

    // Fetch the home page
    this.addSub(
      this.frontendService
        .dataForFrontendHome({
          screenSize: this.layout.screenSize
        })
        .pipe(
          //Before setting the data, fetch possibly missing icons for the quick access
          switchMap(data => {
            const icons = data.quickAccess?.map(qa => this.quickAccessHelper.iconAndLabel(qa).icon).filter(i => !!i);
            if (icons.length === 0) {
              return of(data);
            } else {
              return this.iconLoadingService.load(icons, false).pipe(switchMap(() => of(data)));
            }
          })
        )
        .subscribe(data => {
          this.data = data;
        })
    );
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
    this.initDashboardActions(data);
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
      clear: false
    });
  }

  resolveMenu() {
    return Menu.DASHBOARD;
  }

  initDashboardActions(data: DataForFrontendHome) {
    this.actions = [];
    const dataForFrontend = this.dataForFrontendHolder.dataForFrontend;
    const auth = this.dataForFrontendHolder.auth;
    const permissions = auth.permissions || {};

    if (this.layout.gtsm && dataForFrontend.canManageQuickAccess) {
      this.headingActions = [
        new HeadingAction(
          SvgIcon.Gear,
          this.i18n.dashboard.customizeQuickAccess,
          event =>
            this.menu.navigate({
              menu: new ActiveMenu(Menu.QUICK_ACCESS_SETTINGS),
              clear: false,
              event
            }),
          true
        )
      ];
    }

    const isAdmin = this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR;
    const owner = isAdmin ? ApiHelper.SYSTEM : ApiHelper.SELF;
    const vouchersMenu = new ActiveMenu(
      isAdmin
        ? Menu.SEARCH_VOUCHERS
        : this.dataForFrontendHolder.dataForFrontend.voucherBuyingMenu == UserMenuEnum.MARKETPLACE
        ? Menu.SEARCH_MY_VOUCHERS_MARKETPLACE
        : Menu.SEARCH_MY_VOUCHERS_BANKING
    );
    const voucherTransactionsMenu = new ActiveMenu(Menu.VOUCHER_TRANSACTIONS);
    const paymentRequestsMenu = new ActiveMenu(Menu.PAYMENT_REQUESTS);
    const externalPaymentsMenu = new ActiveMenu(Menu.EXTERNAL_PAYMENTS);
    const myAdsMenu = new ActiveMenu(Menu.SEARCH_USER_ADS);
    const myWebshopMenu = new ActiveMenu(Menu.SEARCH_USER_WEBSHOP);
    const messagesMenu = new ActiveMenu(isAdmin ? Menu.SYSTEM_MESSAGES : Menu.MESSAGES);
    const usersMenu = new ActiveMenu(Menu.SEARCH_USERS);

    for (const quickAccess of data.quickAccess) {
      const addAction = (activeMenu: ActiveMenu, onClick?: () => void, customLabel?: string, url?: string): void => {
        const entry = this.menu.menuEntry(activeMenu);
        if (entry) {
          const iconAndLabel = this.quickAccessHelper.iconAndLabel(quickAccess);
          this.actions.push({
            icon: iconAndLabel?.icon,
            label: customLabel ?? iconAndLabel?.label,
            entry,
            onClick,
            url
          });
        }
      };

      switch (quickAccess.type) {
        case QuickAccessTypeEnum.ACCOUNT:
          // Skip the quick access icon for accounts already visible in the dashboard
          const allAccounts = permissions.banking.accounts || [];
          const showAccount = this.layout.ltmd || empty(data.accounts);
          const accounts = allAccounts.filter(p => showAccount || (p.visible && !p.viewStatus)).map(p => p.account);
          if (accounts.length >= ApiHelper.MIN_ACCOUNTS_FOR_SUMMARY) {
            addAction(new ActiveMenu(Menu.ACCOUNTS_SUMMARY));
          } else {
            for (const account of accounts) {
              const accountType = account.type;
              const accountLabel = allAccounts.length === 1 ? this.i18n.dashboard.action.account : accountType.name;
              addAction(new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType }), null, accountLabel);
            }
          }
          break;
        case QuickAccessTypeEnum.TRANSFERS_OVERVIEW:
          addAction(new ActiveMenu(isAdmin ? Menu.ADMIN_TRANSFERS_OVERVIEW : Menu.BROKER_TRANSFERS_OVERVIEW));
          break;
        case QuickAccessTypeEnum.BALANCES_OVERVIEW:
          addAction(new ActiveMenu(isAdmin ? Menu.ADMIN_USER_BALANCES_OVERVIEW : Menu.BROKER_USER_BALANCES_OVERVIEW));
          break;
        case QuickAccessTypeEnum.PAY_USER:
          addAction(new ActiveMenu(Menu.PAYMENT_TO_USER));
          break;
        case QuickAccessTypeEnum.PAY_SYSTEM:
          addAction(new ActiveMenu(Menu.PAYMENT_TO_SYSTEM));
          break;
        case QuickAccessTypeEnum.PAY_SELF:
          addAction(new ActiveMenu(Menu.PAYMENT_TO_SELF));
          break;
        case QuickAccessTypeEnum.POS:
          addAction(new ActiveMenu(Menu.POS));
          break;
        case QuickAccessTypeEnum.RECEIVE_QR_PAYMENT:
          addAction(new ActiveMenu(Menu.RECEIVE_QR_PAYMENT));
          break;
        case QuickAccessTypeEnum.SCHEDULED_PAYMENTS:
          addAction(new ActiveMenu(Menu.SCHEDULED_PAYMENTS));
          break;
        case QuickAccessTypeEnum.REQUEST_PAYMENT_FROM_USER:
          addAction(paymentRequestsMenu, null, null, `/banking/${owner}/payment-request`);
          break;
        case QuickAccessTypeEnum.REQUEST_PAYMENT_FROM_SYSTEM:
          addAction(paymentRequestsMenu, null, null, `/banking/${owner}/payment-request/${ApiHelper.SYSTEM}`);
          break;
        case QuickAccessTypeEnum.PAYMENT_REQUESTS:
          addAction(paymentRequestsMenu);
          break;
        case QuickAccessTypeEnum.PAY_EXTERNAL_USER:
          addAction(externalPaymentsMenu, null, null, `/banking/${owner}/external-payment`);
          break;
        case QuickAccessTypeEnum.EXTERNAL_PAYMENTS:
          addAction(externalPaymentsMenu);
          break;
        case QuickAccessTypeEnum.VOUCHERS:
          addAction(vouchersMenu);
          break;
        case QuickAccessTypeEnum.BUY_VOUCHER:
          addAction(vouchersMenu, null, null, `/banking/${ApiHelper.SELF}/vouchers/buy`);
          break;
        case QuickAccessTypeEnum.SEND_VOUCHER:
          addAction(vouchersMenu, null, null, `/banking/${ApiHelper.SELF}/vouchers/send`);
          break;
        case QuickAccessTypeEnum.VOUCHER_TRANSACTIONS:
          const voucherTransactionsLabel = this.dataForFrontendHolder.dataForFrontend.topUpEnabled
            ? this.i18n.dashboard.action.voucherTransactions
            : this.i18n.dashboard.action.voucherTransactionsRedeems;
          addAction(new ActiveMenu(Menu.VOUCHER_TRANSACTIONS), null, voucherTransactionsLabel);
          break;
        case QuickAccessTypeEnum.REDEEM_VOUCHER:
          addAction(voucherTransactionsMenu, null, null, `/banking/${ApiHelper.SELF}/vouchers/redeem`);
          break;
        case QuickAccessTypeEnum.TOP_UP_VOUCHER:
          addAction(voucherTransactionsMenu, null, null, `/banking/${ApiHelper.SELF}/vouchers/top-up`);
          break;
        case QuickAccessTypeEnum.CONTACTS:
          addAction(new ActiveMenu(Menu.CONTACTS));
          break;
        case QuickAccessTypeEnum.PENDING_USERS:
          if ((permissions.users || {}).viewPending) {
            addAction(usersMenu, null, null, '/users/search/pending');
          }
          break;
        case QuickAccessTypeEnum.SEARCH_USERS:
          if (!data.showLatestUsers) {
            // Hide the search action if already showing the latest users in the dashboard
            addAction(usersMenu);
          }
          break;
        case QuickAccessTypeEnum.BROKERED_USERS:
          addAction(new ActiveMenu(Menu.MY_BROKERED_USERS));
          break;
        case QuickAccessTypeEnum.REGISTER_USER:
          addAction(new ActiveMenu(isAdmin ? Menu.ADMIN_REGISTRATION : Menu.BROKER_REGISTRATION));
          break;
        case QuickAccessTypeEnum.INVITE_USER:
          addAction(new ActiveMenu(Menu.INVITE));
          break;
        case QuickAccessTypeEnum.SEARCH_ADS:
          if (!data.showLatestAds) {
            // Hide the search action if already showing the latest ads in the dashboard
            addAction(new ActiveMenu(Menu.SEARCH_ADS));
          }
          break;
        case QuickAccessTypeEnum.AD_INTERESTS:
          addAction(new ActiveMenu(Menu.AD_INTERESTS));
          break;
        case QuickAccessTypeEnum.PURCHASES:
          addAction(new ActiveMenu(Menu.PURCHASES));
          break;
        case QuickAccessTypeEnum.MY_ADS:
          addAction(new ActiveMenu(Menu.SEARCH_USER_ADS));
          break;
        case QuickAccessTypeEnum.CREATE_AD:
          addAction(myAdsMenu, null, null, `/marketplace/${ApiHelper.SELF}/${AdKind.SIMPLE}/ad/new`);
          break;
        case QuickAccessTypeEnum.MY_WEBSHOP:
          addAction(new ActiveMenu(Menu.SEARCH_USER_WEBSHOP));
          break;
        case QuickAccessTypeEnum.CREATE_WEBSHOP_AD:
          addAction(myWebshopMenu, null, null, `/marketplace/${ApiHelper.SELF}/${AdKind.WEBSHOP}/ad/new`);
          break;
        case QuickAccessTypeEnum.SALES:
          addAction(new ActiveMenu(Menu.SALES));
          break;
        case QuickAccessTypeEnum.EDIT_PROFILE:
          addAction(new ActiveMenu(Menu.EDIT_MY_PROFILE));
          break;
        case QuickAccessTypeEnum.PASSWORDS:
          const passwordsLabel =
            permissions.passwords.passwords.length === 1
              ? this.i18n.dashboard.action.password
              : this.i18n.dashboard.action.passwords;
          addAction(new ActiveMenu(Menu.PASSWORDS), null, passwordsLabel);
          break;
        case QuickAccessTypeEnum.DOCUMENTS:
          if (!isAdmin) {
            // This frontend doesn't implement management of documents by admins
            addAction(new ActiveMenu(Menu.MY_DOCUMENTS));
          }
          break;
        case QuickAccessTypeEnum.MESSAGES:
          addAction(messagesMenu);
          break;
        case QuickAccessTypeEnum.SEND_MESSAGE:
          addAction(messagesMenu, null, null, `/users/messages/send`);
          break;
        case QuickAccessTypeEnum.NOTIFICATIONS:
          addAction(new ActiveMenu(Menu.NOTIFICATIONS));
          break;
        case QuickAccessTypeEnum.REFERENCES:
          addAction(new ActiveMenu(Menu.REFERENCES));
          break;
        case QuickAccessTypeEnum.TRANSACTION_FEEDBACKS:
          addAction(new ActiveMenu(Menu.FEEDBACKS));
          break;
        case QuickAccessTypeEnum.SWITCH_THEME:
          addAction(new ActiveMenu(Menu.SETTINGS), () => (this.layout.darkTheme = !this.layout.darkTheme));
          break;
        case QuickAccessTypeEnum.SWITCH_FRONTEND:
          if (!environment.standalone) {
            // Don't allow switching frontend in standalone mode
            addAction(new ActiveMenu(Menu.SETTINGS), () => this.dataForFrontendHolder.useClassicFrontend(true));
          }
          break;
        case QuickAccessTypeEnum.SETTINGS:
          addAction(new ActiveMenu(Menu.SETTINGS));
          break;
        case QuickAccessTypeEnum.OPERATION:
          const operation = quickAccess.operation;
          const operationMenu = this.menu.operationEntry(operation?.id);
          if (operationMenu) {
            const action = this.runOperationHelper.canRunDirectly(operation)
              ? () => this.runOperationHelper.run(operation, isAdmin ? null : ApiHelper.SELF)
              : null;
            addAction(operationMenu.activeMenu, action);
          }
          break;
        case QuickAccessTypeEnum.WIZARD:
          const wizardMenu = this.menu.wizardEntry(quickAccess.wizard?.id);
          if (wizardMenu) {
            addAction(wizardMenu.activeMenu);
          }
          break;
        case QuickAccessTypeEnum.RECORD:
          const recordMenu = this.menu.activeMenuForRecordType(isAdmin, quickAccess.recordType);
          if (recordMenu) {
            addAction(recordMenu);
          }
          break;
        case QuickAccessTypeEnum.TOKEN:
          if (!isAdmin) {
            // For now we don't support quick access for general tokens search
            const tokenMenu = this.menu.activeMenuForTokenType(quickAccess.tokenType);
            if (tokenMenu) {
              addAction(tokenMenu);
            }
          }
          break;
        case QuickAccessTypeEnum.HELP:
          if (dataForFrontend.hasHelp) {
            const helpMenu = this.menu.helpMenu;
            addAction(new ActiveMenu(helpMenu));
          }
          break;
      }
    }
  }
}
