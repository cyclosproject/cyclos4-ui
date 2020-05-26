import { Injector } from '@angular/core';
import { AccountWithCurrency, Permissions } from 'app/api/models';
import { ContentGetter } from 'app/content/content-getter';
import { DashboardColumn, DashboardItemConfig } from 'app/content/dashboard-item-config';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { QuickAccessType } from 'app/content/quick-access-type';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { QuickAccessDescriptor } from 'app/content/quick-access-descriptor';

/**
 * By default, the dashboard is comprised of:
 * - Quick access: see the quickAccess() method;
 * - Combined account status: for tablet or desktop
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
      ...this.combinedAccountStatus(injector),
      this.latestAds(injector),
      this.contentPage(),
    ];
  }

  /**
   * Returns a default quick access, comprised of:
   * - Accounts (only for mobile devices, as for larger displays an account status item will be shown per account)
   * - Pay user
   * - Receive QR payment OR Receive Payment (POS)
   * - Contacts
   * - Search users (business directory)
   * - Search ads (marketplace)
   * - Edit profile
   * - Switch theme
   */
  quickAccess(injector: Injector): DashboardItemConfig {
    const banking = this.permissions(injector).banking || {};
    const qr = !!(banking.tickets || {}).create;
    const pos = !!(banking.payments || {}).pos;

    const descriptors: QuickAccessDescriptor[] = [];
    descriptors.push({ type: QuickAccessType.Account, breakpoints: ['lt-md'] });
    descriptors.push({ type: QuickAccessType.PayUser });
    if (qr) {
      descriptors.push({ type: QuickAccessType.ReceiveQRPayment });
    } else if (pos) {
      descriptors.push({ type: QuickAccessType.Pos });
    }
    descriptors.push({ type: QuickAccessType.Contacts });
    descriptors.push({ type: QuickAccessType.SearchUsers });
    descriptors.push({ type: QuickAccessType.SearchAds, breakpoints: pos || qr ? ['lt-md'] : null });
    descriptors.push({ type: QuickAccessType.EditProfile });
    descriptors.push({ type: QuickAccessType.SwitchTheme });
    return DashboardItemConfig.quickAccess({
      descriptors,
      column: 'left',
      minHeight: this.minHeight,
    });
  }

  /**
   * Returns combined account status views, with up to 4 accounts in a single card
   */
  combinedAccountStatus(injector: Injector): DashboardItemConfig[] {
    const banking = this.permissions(injector).banking || {};
    const visibleAccounts = (banking.accounts || []).filter(a => a.viewStatus);
    let accounts = visibleAccounts.map(p => p.account);
    const count = accounts.length;
    if (count === 0) {
      return [];
    } else if (count === 1) {
      // For a single account, use the regular account status box
      return [this.accountStatus(injector, accounts[0], 'right')];
    } else {
      // Calculate which accounts are shown on each card
      const cards = Math.ceil(count / 4);
      const perCard = Math.floor(count / cards);
      let remainder = count % cards;
      const accountsPerCard: AccountWithCurrency[][] = [];
      for (let i = 0; i < cards; i++) {
        let upTo = perCard;
        if (remainder > 0) {
          upTo++;
          remainder--;
        }
        accountsPerCard.push(accounts.slice(0, upTo));
        accounts = accounts.slice(upTo);
      }
      return accountsPerCard.map((cardAccounts, i) => {
        const column: DashboardColumn = (i > 1) && (i % 2 === 0) ? 'left' : 'right';
        return this.actualCombinedAccountStatus(cardAccounts, column);
      });
    }
  }

  /**
   * Returns an account status item for each accounts the user can view status
   */
  accountStatuses(injector: Injector): DashboardItemConfig[] {
    const banking = this.permissions(injector).banking || {};
    const visibleAccounts = (banking.accounts || []).filter(a => a.viewStatus);
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
      account,
      maxTransfers: 3,
      breakpoints: ['gt-sm'],
      column,
      minHeight: this.minHeight,
    });
  }

  /**
   * Returns a dashboard item configuration for combined account statuses
   */
  private actualCombinedAccountStatus(accounts: AccountWithCurrency[], column: DashboardColumn): DashboardItemConfig {
    return DashboardItemConfig.combinedAccountStatus({
      accounts,
      breakpoints: ['gt-sm'],
      column,
      minHeight: this.minHeight,
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
      minHeight: this.minHeight,
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
      minHeight: this.minHeight,
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
      breakpoints: ['gt-xxs'],
    });
  }

  /**
   * Returns the current user's permissions
   */
  protected permissions(injector: Injector): Permissions {
    return (injector.get(DataForUiHolder).auth || {}).permissions || {};
  }

}
