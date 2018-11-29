import { HttpClient } from '@angular/common/http';
import { Injector } from '@angular/core';
import { Banner } from 'app/content/banner';
import { BannerCard } from 'app/content/banner-card';
import { BannerResolver } from 'app/content/banner-resolver';
import { ContentGetter } from 'app/content/content-getter';
import { RootMenu } from 'app/shared/menu';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

/** Fictional root URL of our API backend */
const BACKEND_ROOT = 'https://backend/banners';
const BANKING_CONTENT = BACKEND_ROOT + '/banking';
const PROMOTED_CONTENT = BACKEND_ROOT + '/promoted';

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
   * Returns a cold Observable that resolves all the banner cards
   * @param injector The Angular injector
   */
  resolveCards(injector: Injector): BannerCard[] | Observable<BannerCard[]> {
    const http = injector.get(HttpClient);

    // The fixed card for the banking root menu
    const banking: BannerCard = {
      rootMenus: [RootMenu.BANKING],
      banners: [{
        cacheKey: 'banking-banner',
        content: ContentGetter.url(BANKING_CONTENT)
      }]
    };

    // We fetch the promoted content as a card with rotating banners
    const promoted = http.get<PromotedContent[]>(PROMOTED_CONTENT).pipe(
      map(contents => this.promotedCard(contents))
    );

    // Assemble all banner cards
    return forkJoin(of(banking), promoted);
  }

  private promotedCard(contents: PromotedContent[]): BannerCard {
    return {
      rootMenus: [RootMenu.MARKETPLACE],
      banners: contents.map(content => this.promotedBanner(content))
    };
  }

  private promotedBanner(content: PromotedContent): Banner {
    return {
      cacheKey: `promoted_${content.id}`,
      content: ContentGetter.url(content.url)
    };
  }

}
