import { Banner } from 'app/content/banner';

/**
 * Describes the banners which should be shown in the side area
 */
export interface Banners {

  /** The number of banner cards to show */
  cards: number;

  /** The list of available banners */
  banners: Banner[];

}
