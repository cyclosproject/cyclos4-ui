
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
   *
   * Defaults to large on gt-sm and small.
   *
   * `xxs` is a special case, where the page title is shown instead, and cannot be overridden
   */
  title?: 'large' | 'small' | 'none';

  /**
   * Which is the landing page in this breakpoint: home or login?
   * Defaults to home.
   */
  landingPage?: 'home' | 'login';

}
