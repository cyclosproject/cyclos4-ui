/**
 * The possible types for a quick access
 */
type QuickAccessType = 'account' | 'payUser' | 'paySystem' | 'contacts'
  | 'searchUsers' | 'searchAds' | 'viewProfile' | 'editProfile' | 'passowords';

namespace QuickAccessType {
  /**
   * Account history
   */
  export const ACCOUNT: QuickAccessType = 'account';

  /**
   * Pay to a user
   */
  export const PAY_USER: QuickAccessType = 'payUser';

  /**
   * Pay to a system account
   */
  export const PAY_SYSTEM: QuickAccessType = 'paySystem';

  /**
   * View contacts
   */
  export const CONTACTS: QuickAccessType = 'contacts';

  /**
   * Search users (business directory)
   */
  export const SEARCH_USERS: QuickAccessType = 'searchUsers';

  /**
   * Search advertisements (marketplace)
   */
  export const SEARCH_ADS: QuickAccessType = 'searchAds';

  /**
   * View own profile
   */
  export const VIEW_PROFILE: QuickAccessType = 'viewProfile';

  /**
   * Edit own profile
   */
  export const EDIT_PROFILE: QuickAccessType = 'editProfile';

  /**
   * Manage own passwords
   */
  export const PASSWORDS: QuickAccessType = 'passowords';

  export function values() {
    return [
      ACCOUNT, PAY_USER, PAY_SYSTEM, CONTACTS, SEARCH_USERS,
      SEARCH_ADS, VIEW_PROFILE, EDIT_PROFILE, PASSWORDS
    ];
  }
}

export { QuickAccessType };
