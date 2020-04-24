
/**
 * Configuration for display of a specific media breakpoint
 */
export interface BreakpointConfiguration {

  /**
   * The URL of the logo to display. When set to 'none' no logo is displayed.
   * Defaults to 'images/logo.png'.
   */
  logoUrl?: string;

  /**
   * The text to display in the title bar:
   *
   * - `large`: Shows the `Configuration.appTitle` value
   * - `small`: Shows the `Configuration.appTitleSmall` value
   * - `none`: Shows no title
   * - `any other text`: Use that text as title
   *
   * Defaults to large on gt-sm and small.
   *
   * `xxs` is a special case, where the page title is shown instead, and cannot be overridden
   */
  title?: 'large' | 'small' | 'none' | string;

  /**
   * Which is the landing page in this breakpoint: home or login?
   * Defaults to home.
   */
  landingPage?: 'home' | 'login';

  /**
   * The default view for searching users.
   * The default is `list` for xxs (Jio phone) and `tiles` for other screen sizes.
   */
  defaultUsersResultType?: 'tiles' | 'list' | 'map';

  /**
   * The default view for searching advertisements.
   * The default is `list` for xxs (Jio phone) and `categories` for other screen sizes.
   */
  defaultAdsResultType?: 'categories' | 'tiles' | 'list' | 'map';

}
