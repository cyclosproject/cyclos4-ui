import { Injector } from '@angular/core';
import { AccountWithCurrency, Permissions, RoleEnum } from 'app/api/models';
import { ContentGetter } from 'app/content/content-getter';
import { DashboardColumn, DashboardItemConfig } from 'app/content/dashboard-item-config';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { QuickAccessType } from 'app/content/quick-access-type';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';

/**
 * By default, the dashboard is comprised of:
 * - Quick access: see the quickAccess() method;
 * - Account status for each account: for tablet or desktop, with a maximum of 3 last transfers
 * - Last ads: for tablet or desktop
 * - Content page: except for xxs devices
 */
export class DefaultDashboardResolver implements DashboardResolver {

  constructor(public minHeight = '25.5rem') {
  }

  /**
   * Resolves the default dashboard. May be overridden by subclasses to customize the result
   */
  dashboardItems(injector: Injector): DashboardItemConfig[] {
    return [
      this.quickAccess(injector),
      ...this.accountStatuses(injector),
      this.latestAds(injector),
      this.contentPage()
    ];
  }

  /**
   * Returns a default quick access, comprised of:
   * - Accounts (only for mobile devices, as for larger displays an account status item will be shown per account)
   * - Pay user
   * - Receive payment
   * - Contacts
   * - Search users (business directory)
   * - Search ads (marketplace)
   * - Edit profile
   * - Switch theme
   */
  quickAccess(injector: Injector): DashboardItemConfig {
    const banking = this.permissions(injector).banking || {};
    const pos = !!(banking.payments || {}).pos;

    // The quick access is always there
    return DashboardItemConfig.quickAccess({
      descriptors: [
        { type: QuickAccessType.Account, breakpoints: ['lt-md'] },
        { type: QuickAccessType.PayUser },
        { type: QuickAccessType.Pos },
        { type: QuickAccessType.Contacts },
        { type: QuickAccessType.SearchUsers },
        { type: QuickAccessType.SearchAds, breakpoints: pos ? ['lt-md'] : null },
        { type: QuickAccessType.EditProfile },
        { type: QuickAccessType.SwitchTheme }
      ],
      column: 'left',
      minHeight: this.minHeight
    });
  }

  /**
   * Returns an account status item for each accounts the user can view status
   */
  accountStatuses(injector: Injector): DashboardItemConfig[] {
    const role = injector.get(DataForUiHolder).role;
    const banking = this.permissions(injector).banking || {};
    const allAccounts = (banking.accounts || []);
    // TODO Cyclos 4.12 doesn't send the viewStatus flag for system accounts.
    // This is fixed in 4.12.1. So, version 2.0, which will depend on 4.12.1, we can rely on the viewStatus flag.
    const visibleAccounts = role === RoleEnum.ADMINISTRATOR
      ? allAccounts : allAccounts.filter(a => a.viewStatus);
    const accounts = visibleAccounts.map(p => p.account);
    return accounts.map((a, i) => {
      const column: DashboardColumn = (i > 1) && (i % 2 === 0) ? 'left' : 'right';
      return this.accountStatus(injector, a, column);
    });
  }

  /**
   * Returns the dashboard item config to the given account, or null if not visible
   */
  accountStatus(injector: Injector, account: AccountWithCurrency, column: DashboardColumn = 'right'): DashboardItemConfig | null {
    // Account status
    const banking = this.permissions(injector).banking || {};
    const accountPermission = banking.accounts.find(a => a.account.id === account.id) || {};
    if (!accountPermission.visible) {
      return null;
    }

    return DashboardItemConfig.accountStatus({
      account: account,
      maxTransfers: 3,
      breakpoints: ['gt-sm'],
      column: column,
      minHeight: this.minHeight
    });
  }

  /**
   * Shows the last 6 advertisements on tablet / desktop displays.
   */
  latestAds(injector: Injector): DashboardItemConfig | null {
    // Account status
    const marketplace = this.permissions(injector).marketplace || {};
    const userSimple = marketplace.userSimple || {};
    const userWebshop = marketplace.userWebshop || {};
    if (!userSimple.view && !userWebshop.view) {
      return null;
    }
    return DashboardItemConfig.latestAds({
      max: 6,
      showOwner: false,
      column: 'left',
      breakpoints: ['gt-sm'],
      minHeight: this.minHeight
    });
  }

  /**
   * Shows the last 6 users on tablet / desktop displays
   */
  latestUsers(injector: Injector): DashboardItemConfig | null {
    // Account status
    const users = this.permissions(injector).users || {};
    if (!users.search) {
      return null;
    }
    return DashboardItemConfig.latestUsers({
      max: 6,
      column: 'left',
      breakpoints: ['gt-sm'],
      minHeight: this.minHeight
    });
  }

  /**
   * Shows a content with some mock upcoming events
   */
  contentPage(): DashboardItemConfig {
    return DashboardItemConfig.content({
      title: 'Upcoming events',
      column: 'right',
      tight: true,
      content: ContentGetter.url('content/events.html'),
      minHeight: this.minHeight,
      breakpoints: ['gt-xxs']
    });
  }

  /**
   * Returns the current user's permissions
   */
  protected permissions(injector: Injector): Permissions {
    return (injector.get(DataForUiHolder).auth || {}).permissions || {};
  }

}
