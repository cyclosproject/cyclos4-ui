import { Banner } from 'app/content/banner';
import { Menu, RootMenu } from 'app/shared/menu';
import { Observable } from 'rxjs';

/**
 * Represents a card that shows banners
 */
export interface BannerCard {

  /**
   * Determines on which root menus this card will be visible.
   * When left undefined / null will not filter visibility by root menu.
   */
  rootMenus?: RootMenu[];

  /**
   * Determines on which menus this card will be visible.
   * When left undefined / null will not filter visibility by menu.
   */
  menus?: Menu[];

  /**
   * Determines whether this card is visible for guests.
   * When left undefined / null will not be visible for guests.
   */
  guests?: boolean;

  /**
   * Determines whether this card is visible for logged.
   * When left undefined / null will be visible for logged users.
   */
  loggedUsers?: boolean;

  /**
   * The banners shown in this card
   */
  banners: Banner[] | Observable<Banner[]>;

  /**
   * Custom class / classes to be added to the card.
   * Bootstrap 4 is used. Here are some examples:
   * - 'border-0': Disable border
   * - 'p-0': No padding
   * - 'background-dark': Dark background
   * - 'text-light': Light text
   */
  ngClass?: string | string[] | { [key: string]: any } | Set<string>;

  /**
   * Custom styles to be added to the card
   */
  ngStyle?: { [key: string]: string };

  /**
   * The index of the first visible banner.
   * When undefined, shows the first banner.
   */
  index?: number;

}
