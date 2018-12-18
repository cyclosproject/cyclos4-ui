import { Injector } from '@angular/core';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { QuickAccessType } from 'app/content/quick-access-type';
import { LoginService } from 'app/core/login.service';
import { ContentGetter } from 'app/content/content-getter';

/**
 * By default, the dashboard is comprised of:
 * - Quick access, comprised of:
 *   - Accounts (only for mobile devices, as for larger displays an account status item will be shown per account)
 *   - Pay user
 *   - Contacts
 *   - Search users (business directory)
 *   - Search ads (marketplace)
 *   - Edit profile
 *   - Manage password
 * - Account status for each account (for tablet or desktop), with a maximum of 3 last transfers
 * - Last ads (for tablet or desktop)
 * - Content page (for tablet or desktop)
 */
export class DefaultDashboardResolver implements DashboardResolver {

  resolveItems(injector: Injector): DashboardItemConfig[] {
    const login = injector.get(LoginService);
    const permissions = login.auth.permissions;
    const result: DashboardItemConfig[] = [];

    const minHeight = '25rem';

    // The quick access is always there
    result.push(DashboardItemConfig.quickAccess({
      descriptors: [
        { type: QuickAccessType.ACCOUNT, breakpoints: ['lt-md'] },
        { type: QuickAccessType.PAY_USER },
        { type: QuickAccessType.CONTACTS },
        { type: QuickAccessType.SEARCH_USERS },
        { type: QuickAccessType.SEARCH_ADS },
        { type: QuickAccessType.EDIT_PROFILE },
        { type: QuickAccessType.PASSWORDS },
      ],
      column: 'left',
      minHeight: minHeight
    }));

    // Account status
    const banking = permissions.banking || {};
    const accounts = (banking.accounts || []).filter(a => a.visible).map(p => p.account);
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      result.push(DashboardItemConfig.accountStatus({
        account: account,
        maxTransfers: 3,
        breakpoints: ['gt-sm'],
        // After the 3rd account, toggle left / right
        column: (i > 1) && (i % 2 === 0) ? 'left' : 'right',
        minHeight: minHeight
      }));

      for (const acctPerm of banking.accounts) {
        if (!acctPerm.visible) {
          continue;
        }
      }
    }

    // Latest advertisements
    const marketplace = permissions.marketplace || {};
    if (marketplace.search) {
      result.push(DashboardItemConfig.latestAds({
        max: 6,
        column: 'left',
        breakpoints: ['gt-sm'],
        minHeight: minHeight
      }));
    }

    // Latest users
    // result.push(DashboardItemConfig.latestUsers({
    //   max: 6,
    //   column: 'left',
    //   breakpoints: ['gt-sm'],
    //   minHeight: minHeight
    // }));

    // Content
    result.push(DashboardItemConfig.content({
      title: 'Upcoming events',
      column: 'right',
      tight: true,
      content: ContentGetter.url('content/events.html'),
      minHeight: minHeight
    }));

    return result;
  }

}
