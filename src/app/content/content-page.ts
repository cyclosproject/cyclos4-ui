import { ContentWithLayout } from 'app/content/content-with-layout';
import { RootMenu } from 'app/shared/menu';
import { Injector } from '@angular/core';

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
   * Shorthand for defining a `isVisible()` method that checks whether there's no logged user
   */
  guests?: boolean;

  /**
   * Determines whether this card is visible for logged.
   * True by default.
   * Shorthand for defining a `isVisible()` method that checks whether there's a logged user
   */
  loggedUsers?: boolean;

  /**
   * Returns whether this page is visible for the current context.
   * Called when the menu is re-calculated.
   */
  isVisible?(injector: Injector): boolean;

}
