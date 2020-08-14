
/**
 * Configuration for shortcut icons (favicons)
 */
export interface ShortcutIconConfiguration {

  /**
   * The link tag's `rel` attribute. The default one is `icon`,
   * but can be specified as `apple-touch-icon` for targeting older iOS devices.
   */
  rel?: string;

  /**
   * The pixel size
   */
  size?: number;

  /**
   * The icon URL
   */
  url: string;

}
