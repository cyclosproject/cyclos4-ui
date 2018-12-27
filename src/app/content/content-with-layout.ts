import { Content } from 'app/content/content';
import { empty } from 'app/shared/helper';
import { CardMode } from 'app/content/card-mode';

/**
 * How a content is laid out.
 * May be one of:
 * - `full` (default if has no title): Will use the full width and height
 * - `card`: (default if has title) Will be shown inside a layout card, just like other pages. May have a title.
 */
export type ContentLayout = 'full' | 'card';

/**
 * A content with extra information on how it is laid out
 */
export interface ContentWithLayout extends Content {

  /**
   * The layout for this content page
   */
  layout?: ContentLayout | string;

  /**
   * The title shown when `layout` is `card`
   */
  title?: string;

  /**
   * The card mode when `layout` is `card`.
   * By default is `normal`.
   */
  cardMode?: CardMode;

}

/**
 * Returns whether the given content should be presented in full width layout.
 * Basically handles the case when there's no layout set. In this case, will be full if the title is empty.
 * As a side-effect, modifies the content to set the layout if null, setting to either 'full' if title is or 'card' otherwise.
 */
export function handleFullWidthLayout(content: ContentWithLayout): boolean {
  if (content == null) {
    return false;
  }
  if (content.layout == null) {
    content.layout = empty(content.title) ? 'full' : 'card';
  }
  return content.layout === 'full';
}
