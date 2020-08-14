/* tslint:disable */
import { AdCategoryWithChildren } from 'app/api/models';

/**
 * An ad category with children plus other hierarchy meta data
 */
export interface HierarchyItem extends AdCategoryWithChildren {

  level: number,
  leaf: boolean

}
