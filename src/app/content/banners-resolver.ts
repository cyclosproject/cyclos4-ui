import { BannerFilter } from 'app/content/banner-filter';
import { Banners } from 'app/content/banners';
import { Observable } from 'rxjs';

/**
 * Interface used to resolve the banners which are shown in the side area
 */
export interface BannerResolver {

  /**
   * Returns the banners shown in a given context
   * @param filter The filter used to retrieve the banners
   */
  get(filter: BannerFilter): Observable<Banners>;

}
