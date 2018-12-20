import { ContentWithLayout } from 'app/content/content-with-layout';
import { RootMenu } from 'app/shared/menu';

/** A content page to be displayed */
export interface ContentPage extends ContentWithLayout {

  /**
   * An identifer used on the URL to identify this specific content page.
   * Must be unique among all content pages.
   * When not set, one will be generated.
   */
  slug?: string;

  /**
   * Label to show on the menu.
   * If not set, will use the title, or a default text.
   */
  label?: string;

  /**
   * Icon to show on the menu.
   * If not set, will use a default icon.
   */
  icon?: string;

  /**
   * Indicates on which root menu will this content page be displayed.
   * Valid values are: `RootMenu.CONTENT`, `RootMenu.BANKING`, `RootMenu.MARKETPLACE` and `RootMenu.PERSONAL`
   * If not set, will be on `RootMenu.CONTENT`.
   */
  rootMenu?: RootMenu;

  /**
   * Determines whether this content is visible for guests.
   * True by default.
   */
  guests?: boolean;

  /**
   * Determines whether this card is visible for logged.
   * True by default.
   */
  loggedUsers?: boolean;

}
