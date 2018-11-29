import { Content } from 'app/content/content';

/** The home page content */
export interface HomeContent extends Content {

  /**
   * How to show the home page content.
   * May be one of:
   * - `full` (default): Will use the full width and height
   * - `center`: Will be aligned to the center, with the same width as other pages
   * - `card`: Will be shown inside a layout card, just like other pages. May have a title
   */
  layout?: 'full' | 'center' | 'card';

  /**
   * The title shown when `layout` is `card`
   */
  title?: string;

}
