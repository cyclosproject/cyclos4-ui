import { ContentGetter } from 'app/content/content-getter';

/** A banner which is shown in the side area */
export interface Banner {
  /** The banner id */
  id: string;

  /**
   * The banner title.
   * When undefined, only the content is shown.
   */
  title?: string;

  /**
   * Whether to show the banner inside a card (with border and shadow).
   * When undefined shows the banner inside a card.
   */
  card?: boolean;

  /**
   * Seconds to show the banner before showing the next banner.
   * When undefined, shows the banner for 10 seconds.
   */
  seconds?: number;

  /**
   * Getter of the banner content
   */
  content: ContentGetter;
}
