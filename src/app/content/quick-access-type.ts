/**
 * The possible types for a quick access
 */
export enum QuickAccessType {

  /**
   * Account history
   */
  Account = 'account',

  /**
   * Pay to a user
   */
  PayUser = 'payUser',

  /**
   * Pay to a system account
   */
  PaySystem = 'paySystem',

  /**
   * Receive payment
   */
  Pos = 'pos',

  /**
   * Receive QR-code payment
   */
  ReceiveQRPayment = 'receiveQrPayment',

  /**
   * View contacts
   */
  Contacts = 'contacts',

  /**
   * Search users (business directory)
   */
  SearchUsers = 'searchUsers',

  /**
   * Search advertisements (marketplace)
   */
  SearchAds = 'searchAds',

  /**
   * View own profile
   */
  ViewProfile = 'viewProfile',

  /**
   * Edit own profile
   */
  EditProfile = 'editProfile',

  /**
   * Manage own passwords
   */
  Passwords = 'passowords',

  /**
   * Switch between light and dark themes
   */
  SwitchTheme = 'switchTheme',
}
