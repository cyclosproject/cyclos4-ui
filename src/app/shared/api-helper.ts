import { Entity, Notification, NotificationEntityTypeEnum } from 'app/api/models';
import { empty } from 'app/shared/helper';

/**
 * Helper methods for working with API model
 */
export class ApiHelper {
  /** Value separator for custom fields */
  static VALUE_SEPARATOR = '|';

  /** Represents the own user */
  static SELF = 'self';

  /** Represents the system account owner */
  static SYSTEM = 'system';

  /** The default page size */
  static DEFAULT_PAGE_SIZE = 40;

  /** The available options of page sizes in the paginator */
  static PAGE_SIZES = [40, 100, 200];

  /** The number of results to fetch on autocomplete queries */
  static AUTOCOMPLETE_SIZE = 10;

  /** Time (in ms) to wait between keystrokes to make a request */
  static DEBOUNCE_TIME = 400;

  /** Value used to mark a date as invalid */
  static INVALID_DATE = ' ';

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
   * If the given value is fully numeric, escape it by prepending a single quote.
   * This is the Cyclos' way to distinguish between ids and other keys
   * @param value The value
   */
  static escapeNumeric(value: string): string {
    if (/^[\-\+]?\d+$/.test(value)) {
      // The transaction number is fully numeric. Escape it to avoid clashing with id
      return `'${value}`;
    } else {
      return value;
    }
  }

  /**
   * Returns the given min / max value as a range, suitable for query filters on the API
   */
  static rangeFilter(min: string, max: string): string[] {
    const hasMin = !empty(min);
    const hasMax = !empty(max);
    if (hasMin && hasMax) {
      return [min, max];
    } else if (hasMin) {
      return [min, ''];
    } else if (hasMax) {
      return ['', max];
    } else {
      return [];
    }
  }

  /**
   * Returns the path to where a notification should point to
   * @param notification The Cyclos notification
   */
  static notificationPath(notification: Notification): string {
    switch (notification.entityType) {
      case NotificationEntityTypeEnum.USER:
        return `/users/profile/${notification.entityId}`;
      case NotificationEntityTypeEnum.TRANSACTION:
        return `/banking/transaction/${notification.entityId}`;
      case NotificationEntityTypeEnum.TRANSFER:
        return `/banking/transfer/${notification.entityId}`;
    }
    return undefined;
  }


}
