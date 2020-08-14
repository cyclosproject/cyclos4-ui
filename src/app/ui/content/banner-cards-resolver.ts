import { Injector } from '@angular/core';
import { BannerCard } from 'app/ui/content/banner-card';
import { Observable } from 'rxjs';

/**
 * Interface used to resolve the banner cards which are shown in the side area
 */
export interface BannerCardsResolver {

  /**
   * Returns the available banner cards in the application.
   * @param injector The Angular injector, used to access shared services
   * @returns Either the banner cards or an observable of the banner cards
   */
  bannerCards(injector: Injector): BannerCard[] | Observable<BannerCard[]>;

}
