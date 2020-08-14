
import { Account } from 'app/api/models';
import { Content } from 'app/ui/content/content';
import { DashboardItemType } from 'app/ui/content/dashbord-item-type';
import { QuickAccessDescriptor } from 'app/ui/content/quick-access-descriptor';
import { Breakpoint } from 'app/core/layout.service';

export type DashboardColumn = 'left' | 'right' | 'full';

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
   * In desktop layout, on which column should the item be displayed?
   */
  column?: DashboardColumn;

  /**
   * In desktop layout, which is the minimum item height?
   */
  minHeight?: string;

  /**
   * Configuration data, specific for each item type
   */
  data?: any;

}

namespace DashboardItemConfig {

  /**
   * Common parameters for all dashboard item types
   */
  export interface DashboardItemParams {
    /**
     * On which breakpoints should this item be visible?
     * If not set, will be always visible.
     */
    breakpoints?: Breakpoint[];

    /**
     * On which column (in desktop layout) should this item be visible?
     * Can be either `left`, `right` or `full`.
     */
    column?: DashboardColumn;

    /**
     * What is the minimum height of the item when in desktop layout?
     * When empty, no minimum height is set.
     */
    minHeight?: string;
  }

  /**
   * Parameters for the quick access
   */
  export interface QuickAccessParams extends DashboardItemParams {
    /**
     * Which quick access descriptors to show
     */
    descriptors: QuickAccessDescriptor[];
  }

  /**
   * Returns a generic dashboard item configuration
   * @param type The dashboard item type
   * @param params The dashboard item parameters
   * @param data The data to be passed in to the component
   */
  export function config(type: DashboardItemType, params: DashboardItemParams, data: any): DashboardItemConfig {
    return {
      type,
      data,
      breakpoints: params.breakpoints,
      minHeight: params.minHeight,
      column: params.column,
    };
  }

  /**
   * Returns the configuration for a quick access
   */
  export function quickAccess(params: QuickAccessParams): DashboardItemConfig {
    return config(DashboardItemType.QUICK_ACCESS, params, {
      descriptors: params.descriptors,
    });
  }

  /**
   * Parameters for an account status
   */
  export interface AccountStatusParams extends DashboardItemParams {
    /**
     * Which account to show
     */
    account: Account;

    /**
     * The maximum number of transfers to show in the last incoming payments.
     * When set to zero, incoming payments are not shown.
     */
    maxTransfers?: number;
  }

  /**
   * Parameters for combined account status
   */
  export interface CombinedAccountStatusParams extends DashboardItemParams {
    /**
     * Which accounts to show
     */
    accounts: Account[];
  }

  /**
   * Returns the configuration for the status of an account
   */
  export function accountStatus(params: AccountStatusParams): DashboardItemConfig {
    return config(DashboardItemType.ACCOUNT_STATUS, params, {
      account: params.account,
      maxTransfers: params.maxTransfers,
    });
  }

  /**
   * Returns the configuration for the combined status of multiple accounts
   */
  export function combinedAccountStatus(params: CombinedAccountStatusParams): DashboardItemConfig {
    return config(DashboardItemType.COMBINED_ACCOUNT_STATUS, params, {
      accounts: params.accounts
    });
  }

  /**
   * Parameters for showing the latest advertisements
   */
  export interface LatestAdsParams extends DashboardItemParams {
    /**
     * A list of user groups (internal names / ids)
     */
    groups?: string[];

    /**
     * Maximum number of advertisements
     */
    max?: number;

    /**
     * Indicates whether the advertisement owner should be displayed in the list
     */
    showOwner?: boolean;
  }

  /**
   * Returns the configuration for the latest advertisements
   */
  export function latestAds(params: LatestAdsParams): DashboardItemConfig {
    return config(DashboardItemType.LATEST_ADS, params, {
      groups: params.groups,
      max: params.max == null ? 6 : params.max,
      showOwner: !!params.showOwner,
    });
  }

  /**
   * Parameters for showing the latest users
   */
  export interface LatestUsersParams extends DashboardItemParams {
    /**
     * A list of user groups (internal names / ids)
     */
    groups?: string[];

    /**
     * Maximum number of users
     */
    max?: number;
  }

  /**
   * Returns the configuration for the latest users
   */
  export function latestUsers(params: LatestUsersParams): DashboardItemConfig {
    return config(DashboardItemType.LATEST_USERS, params, {
      groups: params.groups,
      max: params.max == null ? 6 : params.max,
    });
  }

  /**
   * Parameters for a custom content
   */
  export interface ContentParams extends DashboardItemParams, Content {

    /**
     * The optional dashboard item title
     */
    title?: string;

    /**
     * The optional dashboard item title when viewed on a mobile phone.
     * When not specified, defaults to the regular title, if any.
     */
    mobileTitle?: string;

    /**
     * Whether the dashboard item will have no padding.
     * By default the item will have the regular padding.
     */
    tight?: boolean;
  }

  /**
   * Returns the configuration for a content in the dashboard
   */
  export function content(params: ContentParams): DashboardItemConfig {
    return config(DashboardItemType.CONTENT, params, {
      content: params,
      title: params.title,
      tight: params.tight,
    });
  }
}

export { DashboardItemConfig };
