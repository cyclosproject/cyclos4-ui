
import { Account } from 'app/api/models';
import { DashboardItemType } from 'app/content/dashbord-item-type';
import { Breakpoint } from 'app/shared/layout.service';
import { QuickAccessDescriptor } from 'app/content/quick-access-descriptor';
import { empty } from 'app/shared/helper';
import { QuickAccessType } from 'app/content/quick-access-type';

/**
 * Configuration for a dashboard item
 */
interface DashboardItemConfig {

  /**
   * The item type
   */
  type: DashboardItemType;

  /**
   * The layout breakpoints allowed to show this item.
   * When not set or empty, is always visible.
   * For example:
   * - For mobile only, return `['lt-sm']`.
   * - For mobile / tablet, return `['lt-md']`.
   * - For desktop / tablet, return `['gt-xs']`.
   * - For desktop only, return `['gt-md']`.
   */
  breakpoints?: Breakpoint[];

  /**
   * Configuration data, specific for each item type
   */
  data?: any;

}

namespace DashboardItemConfig {

  /**
   * Returns the configuration for a quick access
   * @param descriptors Describes the quick access links that should be shown.
   * When not set, will render the following:
   * - Accounts (only for mobile devices, as for larger displays an account status item will be shown per account)
   * - Pay user
   * - Contacts
   * - Search users (business directory)
   * - Search ads (marketplace)
   * - Edit profile
   * - Manage password (only for desktop / tablet, to fill in 6 items)
   * @param breakpoints The media query breakpoints to show the item
   */
  export function quickAccess(descriptors?: QuickAccessDescriptor[], breakpoints?: Breakpoint[]): DashboardItemConfig {
    if (empty(descriptors)) {
      descriptors = [
        { type: QuickAccessType.ACCOUNT, breakpoints: ['lt-md'] },
        { type: QuickAccessType.PAY_USER },
        { type: QuickAccessType.CONTACTS },
        { type: QuickAccessType.SEARCH_USERS },
        { type: QuickAccessType.SEARCH_ADS },
        { type: QuickAccessType.EDIT_PROFILE },
        { type: QuickAccessType.PASSWORDS, breakpoints: ['gt-sm'] },
      ];
    }
    return {
      type: DashboardItemType.QUICK_ACCESS,
      data: { descriptors: descriptors },
      breakpoints: breakpoints
    };
  }

  /**
   * Returns the configuration for the status of one or more accounts
   * @param accounts The accounts to show
   * @param breakpoints The media query breakpoints to show the item
   */
  export function accountStatus(accounts: Account[], breakpoints?: Breakpoint[]): DashboardItemConfig {
    return {
      type: DashboardItemType.ACCOUNT_STATUS,
      data: { accounts: accounts },
      breakpoints: breakpoints
    };
  }

}

export { DashboardItemConfig };

