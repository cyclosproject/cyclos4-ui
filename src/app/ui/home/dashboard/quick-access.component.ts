import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { DataForFrontendHome, FrontendQuickAccessTypeEnum, RoleEnum } from 'app/api/models';
import { Breakpoint } from 'app/core/layout.service';
import { Arrows } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { ApiHelper } from 'app/shared/api-helper';
import { blurIfClick, empty, handleKeyboardFocus } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { MenuService } from 'app/ui/core/menu.service';
import { BaseDashboardComponent } from 'app/ui/home/dashboard/base-dashboard.component';
import { ActiveMenu, Menu, MenuEntry } from 'app/ui/shared/menu';
import { environment } from 'environments/environment';
import { BehaviorSubject } from 'rxjs';

export interface QuickAccessAction {
  icon: SvgIcon;
  label: string;
  entry: MenuEntry;
  onClick?: () => void;
}

/**
 * Displays the quick access, which are links to common actions
 */
@Component({
  selector: 'quick-access',
  templateUrl: 'quick-access.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickAccessComponent extends BaseDashboardComponent implements OnInit {

  /** Export to template */
  blurIfClick = blurIfClick;

  @Input() data: DataForFrontendHome;

  actions: QuickAccessAction[];
  itemClass$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private menu: MenuService,
    private breadcrumb: BreadcrumbService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.actions = [];
    const auth = this.dataForFrontendHolder.auth;
    const permissions = auth.permissions || {};

    const types = new Set(this.data.quickAccess);

    const addAction = (
      icon: SvgIcon, label: string, activeMenu: ActiveMenu, onClick?: () => void): void => {
      const entry = this.menu.menuEntry(activeMenu);
      if (entry) {
        this.actions.push({
          icon,
          label,
          entry,
          onClick,
        });
      }
    };

    const owner = this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR
      ? ApiHelper.SYSTEM : ApiHelper.SELF;

    // PAYMENTS
    if (permissions.banking) {
      if (types.has(FrontendQuickAccessTypeEnum.ACCOUNT)) {
        // Skip the quick access icon for accounts already visible in the dashboard
        const allAccounts = (permissions.banking.accounts || []);
        const accounts = allAccounts.filter(p => this.layout.ltmd || p.visible && !p.viewStatus).map(p => p.account);
        if (accounts.length >= ApiHelper.MIN_ACCOUNTS_FOR_SUMMARY) {
          addAction(SvgIcon.Wallet2, this.i18n.dashboard.action.accounts, new ActiveMenu(Menu.ACCOUNTS_SUMMARY));
        } else {
          for (const account of accounts) {
            const accountType = account.type;
            const accountLabel = allAccounts.length === 1 ? this.i18n.dashboard.action.account : accountType.name;
            addAction(SvgIcon.Wallet2, accountLabel, new ActiveMenu(Menu.ACCOUNT_HISTORY, { accountType }));
          }
        }
      }
      const payments = permissions.banking.payments || {};
      if (types.has(FrontendQuickAccessTypeEnum.PAY_USER) && payments.user) {
        addAction(SvgIcon.Wallet2ArrowRight, this.i18n.dashboard.action.payUser, new ActiveMenu(Menu.PAYMENT_TO_USER));
      }
      if (types.has(FrontendQuickAccessTypeEnum.PAY_SYSTEM) && payments.system) {
        addAction(SvgIcon.Wallet2ArrowRight, this.i18n.dashboard.action.paySystem, new ActiveMenu(Menu.PAYMENT_TO_SYSTEM));
      }
      if (types.has(FrontendQuickAccessTypeEnum.POS) && payments.pos) {
        addAction(SvgIcon.CreditCard, this.i18n.dashboard.action.pos, new ActiveMenu(Menu.POS));
      }
      const tickets = permissions.banking.tickets || {};
      if (types.has(FrontendQuickAccessTypeEnum.RECEIVE_QR_PAYMENT) && tickets.create) {
        addAction(SvgIcon.QrcodeScan, this.i18n.dashboard.action.receiveqrpayment, new ActiveMenu(Menu.RECEIVE_QR_PAYMENT));
      }

      const scheduledPayments = permissions.banking.scheduledPayments || {};
      if (types.has(FrontendQuickAccessTypeEnum.SCHEDULED_PAYMENTS) && scheduledPayments?.view) {
        addAction(SvgIcon.CalendarEvent, this.i18n.dashboard.action.scheduledPayments, new ActiveMenu(Menu.SCHEDULED_PAYMENTS));
      }

      // PAYMENT REQUESTS
      const paymentRequests = permissions.banking.paymentRequests || {};
      if (types.has(FrontendQuickAccessTypeEnum.REQUEST_PAYMENT_FROM_USER) && paymentRequests?.sendToUser) {
        const sendToUserMenu = new ActiveMenu(Menu.PAYMENT_REQUESTS);
        addAction(SvgIcon.Wallet2ArrowLeft, this.i18n.dashboard.action.sendPaymentRequestToUser, sendToUserMenu,
          () =>
            this.menu.navigate({
              url: `/banking/${owner}/payment-request`,
              menu: sendToUserMenu,
              clear: false
            })
        );
      }
      if (types.has(FrontendQuickAccessTypeEnum.REQUEST_PAYMENT_FROM_SYSTEM) && paymentRequests?.sendToSystem) {
        const sendToSystemMenu = new ActiveMenu(Menu.PAYMENT_REQUESTS);
        addAction(SvgIcon.Wallet2ArrowLeft, this.i18n.dashboard.action.sendPaymentRequestToSystem,
          sendToSystemMenu,
          () =>
            this.menu.navigate({
              url: `/banking/${owner}/payment-request/${ApiHelper.SYSTEM}`,
              menu: sendToSystemMenu,
              clear: false
            })
        );
      }
      if (types.has(FrontendQuickAccessTypeEnum.PAYMENT_REQUESTS) && paymentRequests?.view) {
        addAction(SvgIcon.Wallet2ArrowLeft, this.i18n.dashboard.action.paymentRequests,
          new ActiveMenu(Menu.PAYMENT_REQUESTS));
      }

      const externalPayments = permissions.banking.externalPayments || {};
      if (types.has(FrontendQuickAccessTypeEnum.PAY_EXTERNAL_USER) && externalPayments?.perform) {
        const externalMenu = new ActiveMenu(Menu.EXTERNAL_PAYMENTS);
        addAction(SvgIcon.Wallet2ArrowUpRight, this.i18n.dashboard.action.payExternalUser, externalMenu,
          () =>
            this.menu.navigate({
              url: `/banking/${ApiHelper.SELF}/external-payment`,
              menu: externalMenu,
              clear: false
            })
        );
      }
    }

    // VOUCHERS
    const vouchers = this.menu.resolveVoucherPermissions(permissions.vouchers || {});
    if (types.has(FrontendQuickAccessTypeEnum.VOUCHERS) && vouchers?.viewVouchers) {
      addAction(SvgIcon.Ticket, this.i18n.dashboard.action.vouchers, new ActiveMenu(Menu.SEARCH_MY_VOUCHERS));
    }
    if (types.has(FrontendQuickAccessTypeEnum.BUY_VOUCHER) && vouchers.buy) {
      const buyMenu = new ActiveMenu(Menu.SEARCH_MY_VOUCHERS);
      addAction(SvgIcon.Ticket, this.i18n.dashboard.action.buy, buyMenu,
        () =>
          this.menu.navigate({
            url: `/banking/${ApiHelper.SELF}/vouchers/buy`,
            menu: buyMenu,
            clear: false
          })
      );
    }
    if (types.has(FrontendQuickAccessTypeEnum.SEND_VOUCHER) && vouchers.send) {
      const sendMenu = new ActiveMenu(Menu.SEARCH_MY_VOUCHERS);
      addAction(SvgIcon.Ticket, this.i18n.dashboard.action.send, sendMenu,
        () =>
          this.menu.navigate({
            url: `/banking/${ApiHelper.SELF}/vouchers/send`,
            menu: sendMenu,
            clear: false
          })
      );
    }
    if (types.has(FrontendQuickAccessTypeEnum.VOUCHER_TRANSACTIONS) && vouchers?.viewTransactions) {
      addAction(SvgIcon.TicketTransactions, this.i18n.dashboard.action.voucherTransactions, new ActiveMenu(Menu.VOUCHER_TRANSACTIONS));
    }
    if (types.has(FrontendQuickAccessTypeEnum.REDEEM_VOUCHER) && vouchers?.redeem) {
      const viewTransactionsMenu = new ActiveMenu(Menu.VOUCHER_TRANSACTIONS);
      addAction(SvgIcon.TicketRedeem, this.i18n.dashboard.action.redeem, viewTransactionsMenu,
        () =>
          this.menu.navigate({
            url: `/banking/${ApiHelper.SELF}/vouchers/redeem`,
            menu: viewTransactionsMenu,
            clear: false
          })
      );
    }
    if (types.has(FrontendQuickAccessTypeEnum.TOP_UP_VOUCHER) && vouchers?.topUp) {
      const viewTransactionsMenu = new ActiveMenu(Menu.VOUCHER_TRANSACTIONS);
      addAction(SvgIcon.TicketTopUp, this.i18n.dashboard.action.topUp, viewTransactionsMenu,
        () =>
          this.menu.navigate({
            url: `/banking/${ApiHelper.SELF}/vouchers/top-up`,
            menu: viewTransactionsMenu,
            clear: false
          })
      );
    }

    // USERS
    if (types.has(FrontendQuickAccessTypeEnum.CONTACTS) && (permissions.contacts || {}).enable) {
      addAction(SvgIcon.Book, this.i18n.dashboard.action.contacts, new ActiveMenu(Menu.CONTACTS));
    }
    const users = permissions.users || {};
    if (types.has(FrontendQuickAccessTypeEnum.SEARCH_USERS)
      && !this.data.showLatestUsers
      && (users.search || users.map)) {
      addAction(SvgIcon.People, this.i18n.dashboard.action.directory, new ActiveMenu(Menu.SEARCH_USERS));
    }

    // MARKETPLACE
    const marketplace = permissions.marketplace || {};
    if (types.has(FrontendQuickAccessTypeEnum.SEARCH_ADS)
      && !this.data.showLatestAds
      && ((marketplace.userSimple || {}).view || (marketplace.userWebshop || {}).view)) {
      addAction(SvgIcon.Basket, this.i18n.dashboard.action.advertisements, new ActiveMenu(Menu.SEARCH_ADS));
    }

    // PROFILE
    if (types.has(FrontendQuickAccessTypeEnum.EDIT_PROFILE) && (permissions.myProfile || {}).editProfile) {
      addAction(SvgIcon.Person, this.i18n.dashboard.action.editProfile, new ActiveMenu(Menu.EDIT_MY_PROFILE));
    }
    if (types.has(FrontendQuickAccessTypeEnum.PASSWORDS) && !empty((permissions.passwords || {}).passwords)) {
      const passwordsLabel = permissions.passwords.passwords.length === 1 ?
        this.i18n.dashboard.action.password :
        this.i18n.dashboard.action.passwords;
      addAction(SvgIcon.Key, passwordsLabel, new ActiveMenu(Menu.PASSWORDS));
    }

    // SETTINGS
    if (types.has(FrontendQuickAccessTypeEnum.SWITCH_THEME)) {
      addAction(SvgIcon.LightDark, this.i18n.dashboard.action.switchTheme, new ActiveMenu(Menu.SETTINGS),
        () => this.layout.darkTheme = !this.layout.darkTheme);
    }
    if (types.has(FrontendQuickAccessTypeEnum.USE_CLASSIC_FRONTEND)
      && !environment.standalone
      && this.dataForFrontendHolder.dataForFrontend.allowFrontendSwitching) {
      addAction(SvgIcon.Display, this.i18n.dashboard.action.classicFrontend, new ActiveMenu(Menu.SETTINGS),
        () => this.dataForFrontendHolder.useClassicFrontend(true));
    }
    if (types.has(FrontendQuickAccessTypeEnum.SETTINGS)) {
      addAction(SvgIcon.Gear, this.i18n.dashboard.action.settings, new ActiveMenu(Menu.SETTINGS));
    }

    // Handle keyboard shortcuts: arrows to navigate correctly on the grid
    this.addShortcut(Arrows, event => {
      handleKeyboardFocus(this.layout, this.element, event, {
        horizontalOffset: 1, verticalOffset: 2,
      });
    });

    // Also add a shortcut on each action by number
    for (let i = 0; i < 9 && i < this.actions.length; i++) {
      const action = this.actions[i];
      this.addShortcut(String(i + 1), e => {
        if (this.layout.gtxs) {
          // Ignore if not on mobile
          return false;
        }
        this.navigate(action, e);
      });
    }

    this.updateItemClass(this.layout.activeBreakpoints);
    this.addSub(this.layout.breakpointChanges$.subscribe(b => this.updateItemClass(b)));
    this.fullWidth = this.actions.length > 6;
  }

  private updateItemClass(breakpoints: Set<Breakpoint>) {
    // Maximum number of items for the current resolution
    const max = breakpoints.has('lt-sm') ? 2
      : breakpoints.has('sm') ? 3
        : breakpoints.has('md') ? 5
          : breakpoints.has('lg') ? 6
            : 8;

    const len = this.actions.length;
    // With up to 6 items, we will show them in a box with the same height as others.
    // With more than 6 items, the dashboard will take up full width and up to 8 items fit.
    let size: number;
    if (len <= 6) {
      size = Math.min(max, 3);
    } else {
      const lines = Math.ceil(len * 1.0 / max);
      size = Math.ceil(len / lines);
    }
    this.itemClass$.next(`quick-access-item-container-${size}`);
  }

  navigate(action: QuickAccessAction, event?: Event) {
    if (action.onClick) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      action.onClick();
    } else {
      this.breadcrumb.clear();
      this.breadcrumb.breadcrumb$.next(['/']);
      this.menu.navigate({
        entry: action.entry,
        clear: false,
        event,
      });
    }
  }

  shortcutKey(action: QuickAccessAction): string {
    if (this.layout.xxs) {
      const index = this.actions.indexOf(action);
      if (index >= 0 && index < 9) {
        return String(index + 1);
      }
    }
  }

}
