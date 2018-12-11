
import { Account } from 'app/api/models';
import { DashboardItemType } from 'app/content/dashbord-item-type';
import { QuickAccessDescriptor } from 'app/content/quick-access-descriptor';
import { Breakpoint } from 'app/shared/layout.service';

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
   * In which column should the item be displayed?
   */
  column?: 'left' | 'right';

  /**
   * Configuration data, specific for each item type
   */
  data?: any;

}

namespace DashboardItemConfig {

  export interface DashboardItemParams {
    breakpoints?: Breakpoint[];
    column?: 'left' | 'right';
  }

  export interface QuickAccessParams extends DashboardItemParams {
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
      type: type,
      data: data,
      breakpoints: params.breakpoints,
      column: params.column
    };
  }

  /**
   * Returns the configuration for a quick access
   */
  export function quickAccess(params: QuickAccessParams): DashboardItemConfig {
    return config(DashboardItemType.QUICK_ACCESS, params, {
      descriptors: params.descriptors
    });
  }

  export interface AccountStatusParams extends DashboardItemParams {
    account: Account;
    maxTransfers?: number;
  }

  /**
   * Returns the configuration for the status of an account
   */
  export function accountStatus(params: AccountStatusParams): DashboardItemConfig {
    return config(DashboardItemType.ACCOUNT_STATUS, params, {
      account: params.account,
      maxTransfers: params.maxTransfers
    });
  }

  export interface LatestAdsParams extends DashboardItemParams {
    groups?: string[];
    max?: number;
  }

  /**
   * Returns the configuration for the latest advertisements
   */
  export function latestAds(params: LatestAdsParams): DashboardItemConfig {
    return config(DashboardItemType.LATEST_ADS, params, {
      groups: params.groups,
      max: params.max == null ? 6 : params.max
    });
  }

}

export { DashboardItemConfig };

