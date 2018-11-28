import { Content } from 'app/content/content';

/** A banner which is shown in the side area */
export interface Banner extends Content {

  /**
   * An optional link URL. When set
   */
  link?: string | any[];

  /**
   * An optional link target. Same as HTML `<a target="xxx">` attribute.
   * When not specified, assumes `_self`.
   */
  linkTarget?: string;

  /**
   * Seconds to show the banner before showing the next banner.
   * When undefined, shows the banner for 10 seconds.
   */
  timeout?: number;

}
