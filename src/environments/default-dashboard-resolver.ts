import { Injector } from '@angular/core';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { QuickAccessType } from 'app/content/quick-access-type';
import { LoginService } from 'app/core/login.service';

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
      column: 'left'
    }));

    // Account status
    const banking = permissions.banking || {};
    const accounts = (banking.accounts || []).filter(a => a.visible).map(p => p.account);
    for (const account of accounts) {
      result.push(DashboardItemConfig.accountStatus({
        account: account,
        maxTransfers: 3,
        breakpoints: ['gt-sm'],
        column: 'right'
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
        breakpoints: ['gt-sm'],
        column: 'left'
      }));
    }

    return result;
  }

}
