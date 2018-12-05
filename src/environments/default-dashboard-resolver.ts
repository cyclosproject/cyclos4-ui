import { Injector } from '@angular/core';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { DashboardResolver } from 'app/content/dashboard-resolver';
import { LoginService } from 'app/core/login.service';
import { empty } from 'app/shared/helper';

/**
 * By default, the dashboard is comprised of:
 * - Quick access
 * - Status for each account
 * - Last transfers
 * - Last users
 * - Last ads
 */
export class DefaultDashboardResolver implements DashboardResolver {

  resolveItems(injector: Injector): DashboardItemConfig[] {
    const login = injector.get(LoginService);
    const permissions = login.auth.permissions;
    const result: DashboardItemConfig[] = [];

    // The quick access is always there
    result.push(DashboardItemConfig.quickAccess());

    const banking = permissions.banking || {};
    const accounts = (banking.accounts || []).filter(a => a.visible).map(p => p.account);
    if (!empty(accounts)) {
      // There's at least one visible account - add the account status
      result.push(DashboardItemConfig.accountStatus(accounts, ['gt-md']));

      for (const acctPerm of banking.accounts) {
        if (!acctPerm.visible) {
          continue;
        }
      }
    }

    return result;
  }

}
