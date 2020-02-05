import {
  AccountWithOwner, AdminMenuEnum, Auth, Entity, Notification,
  NotificationEntityTypeEnum, Operation, OperationScopeEnum, UserMenuEnum, DatePeriod, NotificationTypeEnum
} from 'app/api/models';
import { empty } from 'app/shared/helper';
import { ActiveMenu, Menu, RootMenu } from 'app/shared/menu';


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
   * Returns the account owner identifier: either the user id or `system`
   */
  static accountOwner(account: AccountWithOwner): string {
    if (account) {
      const user = account.user;
      return user ? user.id : ApiHelper.SYSTEM;
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
   * Shift the passed date to the end of the day if it is not empty, otherwise return the same date.
   * e.g 13/01/2019 -> 13/01/2019T23:59:59.999
   * e.g 13/01/2019T00:00:00.000 -> 13/01/2019T23:59:59.999
   * @param date a date formatted like dd/mm/yyyy or yyyy-MM-dd'T'HH:mm:ssZ
   */
  static shiftToDayEnd(date: string): string {
    if (date) {
      const newDate = date.substr(0, 10);
      return newDate.concat('T23:59:59.999');
    } else {
      return date;
    }
  }

  /**
   * Shift the max date to the end of the day and returns it with the min as a range,
   * suitable for query filters on the API.
   */
  static dateRangeFilter(min: string, max: string): string[] {
    return this.rangeFilter(min, this.shiftToDayEnd(max));
  }
  /**
   * Shift the max date to the end of the day and returns it with the min as range,
   * suitable for posting a date period on the API
   */
  static datePeriod(min: string, max: string): DatePeriod {
    const range = this.rangeFilter(min, this.shiftToDayEnd(max));
    if (range.length > 0) {
      return { begin: range[0], end: range[1] };
    }
    return null;
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
  static notificationData(notification: Notification): { path: string, menu: ActiveMenu } {
    switch (notification.entityType) {
      case NotificationEntityTypeEnum.USER:
        return {
          path: `/users/${notification.entityId}/profile`,
          menu: new ActiveMenu(Menu.SEARCH_USERS)
        };
      case NotificationEntityTypeEnum.TRANSACTION:
        return {
          path: `/banking/transaction/${notification.entityId}`,
          menu: new ActiveMenu(Menu.ACCOUNT_HISTORY)
        };
      case NotificationEntityTypeEnum.TRANSFER:
        return {
          path: `/banking/transfer/${notification.entityId}`,
          menu: new ActiveMenu(Menu.ACCOUNT_HISTORY)
        };
      case NotificationEntityTypeEnum.MARKETPLACE:
        return {
          path: `/marketplace/view/${notification.entityId}`,
          menu: new ActiveMenu(Menu.SEARCH_ADS)
        };
      case NotificationEntityTypeEnum.AD_QUESTION:
        const answer = notification.type === NotificationTypeEnum.AD_QUESTION_ANSWERED;
        return {
          path: answer ?
            `/marketplace/view/${notification.entityId}` :
            `/marketplace/unanswered-questions/view/${notification.entityId}`,
          menu: new ActiveMenu(answer ? Menu.SEARCH_ADS : Menu.UNANSWERED_QUESTIONS)
        };
      case NotificationEntityTypeEnum.ORDER:
        return {
          path: `/marketplace/order/${notification.entityId}`,
          menu: new ActiveMenu(ApiHelper.isBuyerOrderNotification(notification.type) ?
            Menu.PURCHASES : Menu.SALES)
        };
    }
  }

  /**
   * Returns if the given notification type is an order notification for buyer (otherwise should be for seller)
   */
  static isBuyerOrderNotification(type: NotificationTypeEnum): boolean {
    switch (type) {
      case NotificationTypeEnum.ORDER_CANCELED_BUYER:
      case NotificationTypeEnum.ORDER_PAYMENT_CANCELED_BUYER:
      case NotificationTypeEnum.ORDER_PAYMENT_EXPIRED_BUYER:
      case NotificationTypeEnum.ORDER_PAYMENT_DENIED_BUYER:
      case NotificationTypeEnum.ORDER_PENDING_AUTHORIZATION_BUYER:
      case NotificationTypeEnum.ORDER_PENDING_BUYER:
      case NotificationTypeEnum.ORDER_PENDING_DELIVERY_DATA_BUYER:
      case NotificationTypeEnum.ORDER_REALIZED_SELLER:
      case NotificationTypeEnum.ORDER_REJECTED_BY_SELLER:
      case NotificationTypeEnum.SALE_PENDING_BUYER:
      case NotificationTypeEnum.SALE_REJECTED_SELLER:
        return true;
    }
    return false;
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
    let menu: Menu = Menu.RUN_OPERATION_BANKING; // Default to the most probable menu
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
        return `/users/${id}/profile`;
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

  /**
   * Indicates whether the current access is restricted. The cases are:
   * - Expired access password
   * - Pending agreements
   *
   * Secondary access password (login confirmation) is not yet implemented in this
   * front-end, hence, not returned as restricted access
   * - Pending secondary password
   * - Expired secondary password
   */
  static isRestrictedAccess(auth: Auth): boolean {
    if (auth) {
      return auth.expiredPassword || auth.pendingAgreements;
    }
    return false;
  }

  /**
   * Opens a popup window with a given HTML content
   */
  static openPopup(content: string, width: number, height: number): Window {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    const options = `top=${top},left=${left},width=${width},height=${height},`
      + 'personalbar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes';

    const style = getComputedStyle(document.body);
    const win = window.open('about:blank', 'identityProvider', options);
    win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
    <style>
      html {
        height: 100%;
      }
      body {
        height: 100%;
        background: ${style.background};
        color: ${style.color};
        overflow-y: auto;
        font: ${style.font};
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0;
        padding: 0;
      }
    </style>
    </head>
    <body>
    ${content}
    </body>
    </html>`);
    return win;
  }
}
