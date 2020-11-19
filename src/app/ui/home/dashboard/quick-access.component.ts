import { ChangeDetectionStrategy, Component, HostBinding, Injector, Input, OnInit } from '@angular/core';
import { DataForFrontendHome, FrontendQuickAccessTypeEnum } from 'app/api/models';
import { Arrows } from 'app/core/shortcut.service';
import { SvgIcon } from 'app/core/svg-icon';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseComponent } from 'app/shared/base.component';
import { blurIfClick, empty, handleKeyboardFocus } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { MenuService } from 'app/ui/core/menu.service';
import { ActiveMenu, Menu, MenuEntry } from 'app/ui/shared/menu';

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
export class QuickAccessComponent extends BaseComponent implements OnInit {

  @HostBinding('class.dashboard-item') classItem = true;

  /** Export to template */
  blurIfClick = blurIfClick;

  @Input() data: DataForFrontendHome;

  actions: QuickAccessAction[];

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
    }
    if (types.has(FrontendQuickAccessTypeEnum.CONTACTS) && (permissions.contacts || {}).enable) {
      addAction(SvgIcon.Book, this.i18n.dashboard.action.contacts, new ActiveMenu(Menu.CONTACTS));
    }
    const users = permissions.users || {};
    if (types.has(FrontendQuickAccessTypeEnum.SEARCH_USERS)
      && !this.data.showLatestUsers
      && (users.search || users.map)) {
      addAction(SvgIcon.People, this.i18n.dashboard.action.directory, new ActiveMenu(Menu.SEARCH_USERS));
    }
    const marketplace = permissions.marketplace || {};
    if (types.has(FrontendQuickAccessTypeEnum.SEARCH_ADS)
      && !this.data.showLatestAds
      && ((marketplace.userSimple || {}).view || (marketplace.userWebshop || {}).view)) {
      addAction(SvgIcon.Basket, this.i18n.dashboard.action.advertisements, new ActiveMenu(Menu.SEARCH_ADS));
    }
    if (types.has(FrontendQuickAccessTypeEnum.EDIT_PROFILE) && (permissions.myProfile || {}).editProfile) {
      addAction(SvgIcon.Person, this.i18n.dashboard.action.editProfile, new ActiveMenu(Menu.EDIT_MY_PROFILE));
    }
    if (types.has(FrontendQuickAccessTypeEnum.PASSWORDS) && !empty((permissions.passwords || {}).passwords)) {
      const passwordsLabel = permissions.passwords.passwords.length === 1 ?
        this.i18n.dashboard.action.password :
        this.i18n.dashboard.action.passwords;
      addAction(SvgIcon.Key, passwordsLabel, new ActiveMenu(Menu.PASSWORDS));
    }
    if (types.has(FrontendQuickAccessTypeEnum.SWITCH_THEME)) {
      addAction(SvgIcon.LightDark, this.i18n.dashboard.action.switchTheme, new ActiveMenu(Menu.SETTINGS),
        () => this.layout.darkTheme = !this.layout.darkTheme);
    }
    if (types.has(FrontendQuickAccessTypeEnum.USE_CLASSIC_FRONTEND) && this.dataForFrontendHolder.dataForFrontend.allowFrontendSwitching) {
      addAction(SvgIcon.Display, this.i18n.dashboard.action.classicFrontend, new ActiveMenu(Menu.SETTINGS),
        () => this.dataForFrontendHolder.useClassicFrontend(true));
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
