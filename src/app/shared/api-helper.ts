import {
  AdminMenuEnum, Entity, Notification, NotificationEntityTypeEnum,
  Operation, OperationScopeEnum, UserMenuEnum
} from 'app/api/models';
import { empty } from 'app/shared/helper';
import { Menu, RootMenu } from 'app/shared/menu';

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


  /**
   * Returns whether the given frontend root menu matches the Cyclos root menu for an administrator function.
   * As the administration functions are restricted in this frontend, matches `USER_MANAGEMENT` and the rest to `BANKING`.
   */
  static adminMenuMatches(root: RootMenu, adminMenu: AdminMenuEnum) {
    if (adminMenu === AdminMenuEnum.USER_MANAGEMENT) {
      return root === RootMenu.MARKETPLACE;
    } else {
      return root === RootMenu.BANKING;
    }
  }

  /**
   * Returns whether the given frontend root menu matches the Cyclos root menu for a user function.
   */
  static userMenuMatches(root: RootMenu, userMenu: UserMenuEnum) {
    switch (userMenu) {
      case UserMenuEnum.BANKING:
        return root === RootMenu.BANKING;
      case UserMenuEnum.COMMUNITY:
      case UserMenuEnum.MARKETPLACE:
        return root === RootMenu.MARKETPLACE;
      case UserMenuEnum.PERSONAL:
        return root === RootMenu.PERSONAL;
    }
    return false;
  }

  /**
   * Returns the menu for running an own custom operation, according to the given operation type.
   * This works for both system-scoped operations or user-scoped operations for the current user.
   * @param operation The operation
   */
  static menuForOwnerOperation(operation: Operation): Menu {
    const possibleMenus = [
      Menu.RUN_OPERATION_BANKING, Menu.RUN_OPERATION_MARKETPLACE, Menu.RUN_OPERATION_PERSONAL
    ];
    let menu: Menu;
    if (operation.scope === OperationScopeEnum.SYSTEM) {
      for (const current of possibleMenus) {
        if (ApiHelper.adminMenuMatches(current.root, operation.adminMenu)) {
          menu = current;
          break;
        }
      }
    } else {
      for (const current of possibleMenus) {
        if (ApiHelper.userMenuMatches(current.root, operation.userMenu)) {
          menu = current;
          break;
        }
      }
    }
    return menu;
  }

  /**
   * Attempts to map a Cyclos location to a location in this frontend
   * @param location The Cyclos location
   */
  static urlForLocation(location: string, id?: string): string {
    switch (location) {
      case 'transaction':
      case 'payment':
      case 'scheduledPayment':
      case 'recurringPayment':
      case 'paymentRequest':
      case 'externalPayment':
      case 'ticket':
        return `/banking/transaction/${id}`;
      case 'transfer':
        return `/banking/transfer/${id}`;
      case 'user':
      case 'userProfile':
        return `/users/profile/${id}`;
      case 'advertisement':
        return `/marketplace/view/${id}`;
      case 'password':
      case 'passwords':
        return `/personal/passwords`;
      case 'notification':
      case 'notifications':
        return `/personal/notifications`;
    }
  }
}
