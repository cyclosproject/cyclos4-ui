import { BannerFilter } from 'app/content/banner-filter';
import { Observable } from 'rxjs';
import { Banner } from 'app/content/banner';

/**
 * Interface used to resolve the banners which are shown in the side area
 */
export interface BannerResolver {

  /**
   * Returns the banners shown in a given context.
   * Is 2-dimensional array. The 1st dimension determines how many cards will be displayed.
   * The 2nd dimension contains the banners shown on each card. When there's more than 1 banner,
   * will rotate them after a given number of seconds.
   * @param filter The filter used to retrieve the banners
   */
  list(filter: BannerFilter): Observable<Banner[][]>;

}
