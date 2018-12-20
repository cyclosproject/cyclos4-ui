import { BannerCard } from 'app/content/banner-card';
import { BannerResolver } from 'app/content/banner-resolver';
import { RootMenu } from 'app/shared/menu';

const CONTENT = `
  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  Sed quis vulputate erat, quis euismod felis. Nam ut ex nisl.
  Phasellus sed odio fringilla, aliquam sem id, consequat velit.
  Sed elit urna, pharetra non magna quis, porttitor finibus ipsum.
  Integer vitae ligula sapien. In nec consectetur leo, ut rhoncus ligula.
  Fusce metus dolor, sollicitudin a porta pulvinar, ornare eu felis.
  Vestibulum porta nisl at eleifend hendrerit. Ut eget dictum libero,
  sit amet sollicitudin leo. Praesent tincidunt vel turpis eu placerat.
  Integer felis est, dapibus in interdum in, elementum posuere nisi.
  Duis accumsan facilisis ante, a facilisis nisl tincidunt ut. Sed nec
  egestas nulla, scelerisque rutrum nulla. Duis scelerisque posuere odio,
  ut ullamcorper nunc efficitur at. Aliquam et lobortis sem.`;

/** Defines the objects fetched from the server */
export interface PromotedContent {
  id: string;
  url: string;
}

/**
 * This is an example `BannerResolver`. It has a fixed banner card for the banking
 * root menu (which could, for example, offer some banking service to users, such
 * as loans or cards) and a card that rotates promoted content (which could be
 * businesses or advertisements) to be shown in the marketplace root menu.
 */
export class ExampleBannerResolver implements BannerResolver {

  /**
   * Returns some example banners
   */
  resolveCards(): BannerCard[] {

    // The fixed card for the banking root menu
    const banking: BannerCard = {
      rootMenus: [RootMenu.BANKING],
      banners: [{
        content: CONTENT
      }]
    };

    // We fetch the promoted content as a card with rotating banners
    const promoted: BannerCard = {
      //      rootMenus: [RootMenu.MARKETPLACE, RootMenu.PUBLIC_MARKETPLACE],
      loggedUsers: true,
      guests: true,
      banners: [{
        content: 'First banner showing on marketplace'
      },
      {
        content: 'Second banner showing on marketplace'
      },
      {
        content: 'Third banner showing on marketplace'
      }]
    };

    return [banking, promoted];
  }

}
