/* tslint:disable */
import { Image } from 'app/api/models/image';
import { PasswordInput } from 'app/api/models/password-input';
import { OidcClient } from './oidc-client';

/**
 * Data for presenting an OAuth2 / OpenID Connect consent page
 */
export interface OidcDataForConsent {
  /**
   * Application logo for the Cyclos instance
   */
  applicationLogo?: Image;

  /**
   * Name of the Cyclos instance
   */
  applicationName?: string;

  /**
   * The OpenID Connect client
   */
  client?: OidcClient;

  /**
   * The ISO 3166-1 alpha-2 country code, as set in the configuration
   */
  country?: string;

  /**
   * The ISO locale
   */
  locale?: string;

  /**
   * Hint for using as user login
   */
  loginHint?: string;

  /**
   * A new key is generated after each server restart
   */
  resourceCacheKey?: string;

  /**
   * The requested scopes descriptions
   */
  scopes?: Array<string>;

  /**
   * Whether the only requested scope is openid
   */
  openidOnly?: boolean;

  /**
   * Whether the offline access scope was requested
   */
  offlineAccess?: boolean;

  /**
   * The formatted time interval after which the authorization will expire.
   * Is null if the offline_access scope is requested.
   */
  expiresAfter?: string;

  /**
   * If set, is the specific account requested for current status or history scopes
   */
  accountType?: string;

  /**
   * If set, is the specific payment destination
   */
  paymentTo?: string;

  /**
   * If set, is the specific payment amount
   */
  paymentAmount?: string;

  /**
   * If true indicates that the consent is valid for a single payment only
   */
  singlePayment?: boolean;

  /**
   * Shortcut icon for the Cyclos instance
   */
  shortcutIcon?: Image;

  /**
   * Data for the password input
   */
  passwordInput?: PasswordInput;
}
