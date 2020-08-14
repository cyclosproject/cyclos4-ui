import { QuickAccessType } from 'app/ui/content/quick-access-type';
import { Breakpoint } from 'app/core/layout.service';

/**
 * Describes a quick access that should be displayed
 */
export interface QuickAccessDescriptor {

  /**
   * The quick access type
   */
  type: QuickAccessType;

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
   * Only for quick access of type `ACCOUNT`.
   * Indicates the id / internal name of a specific account type.
   * If the type is `ACCOUNT` and no `accountType` is provided, will generate one quick access per visible account type.
   */
  accountType?: string;
}
