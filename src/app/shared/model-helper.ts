import { Entity } from "app/api/models";
import { environment } from "environments/environment"

/**
 * Helper methods for working with API model
 */
export class ModelHelper {

  /** Represents the own user */
  static SELF = 'self';

  /**
   * Returns the entity internal name, if any, otherwise the id.
   * If the input entity is null, returns null.
   * @param entity The entity
   */
  static internalNameOrId(entity: Entity): string {
    if (entity) {
      return entity['internalName'] || entity.id;
    }
    return null;
  }

  /**
   * Returns the available options for page sizes on searches
   */
  static get searchPageSizes(): number[] {
    return environment.searchPageSizes || [40, 100, 200];
  }
  /**
   * Returns the available options for page sizes on searches
   */
  static get defaultSearchPageSize(): number {
    return ModelHelper.searchPageSizes[0];
  }

  /**
   * Returns the number of results to be returned in a quick search
   */
  static get quickSearchPageSize(): number {
    return environment.quickSearchPageSize || 10;
  }
}