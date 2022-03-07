import { environment } from 'app/../environments/environment';
import {
  AccountWithOwner,
  DataForFrontend,
  DatePeriod,
  Entity,

  FrontendEnum,

  InternalNamedEntity,
  NamedEntity,
  Notification,
  NotificationEntityTypeEnum,
  NotificationTypeEnum
} from 'app/api/models';
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

  /** Time (in ms) to wait between keystrokes to make a request */
  static DEBOUNCE_TIME = 400;

  /** Value used to mark a date as invalid */
  static INVALID_DATE = ' ';

  /** The minimum number of accounts to show the account summary instead of individual accounts */
  static MIN_ACCOUNTS_FOR_SUMMARY = 7;

  /**
   * Returns the entity internal name, if any, otherwise the id.
   * If the input entity is null, returns null.
   * @param entity The entity
   */
  static internalNameOrId(entity: Entity | InternalNamedEntity): string {
    if (entity) {
      return this.isInternalNamed(entity) ? entity.internalName : entity.id;
    }
    return null;
  }

  /**
   * Asserts that an entity has internal name
   */
  static isInternalNamed(entity: Entity): entity is InternalNamedEntity {
    return (entity as InternalNamedEntity).internalName !== undefined;
  }

  /**
   * Asserts that an entity has name
   */
  static is(entity: Entity): entity is NamedEntity {
    return (entity as NamedEntity).name !== undefined;
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
   * This is the Cyclos' way to distinguish between ids and other keys.
   * The result is never null, and is always trimmed.
   * @param value The value
   */
  static escapeNumeric(value: string): string {
    value = (value || '').trim();
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
      const newDate = date.substring(0, 10);
      return newDate.concat('T23:59:59.999');
    } else {
      return date;
    }
  }

  /**
   * Removes a locator type or escaping quote.
   * Examples: `plainLocator('type:1234') === '1234'`, `plainLocator('\'1234') === '1234'`
   */
  static plainLocator(value: string): string {
    if (empty(value)) {
      return '';
    }
    const pos = value.trim().indexOf(':');
    value = pos >= 0 ? value.substring(pos + 1) : value;
    if (value.startsWith('\'')) {
      value = value.substring(1);
    }
    return value;
  }

  /**
   * Returns whether both locators are equals according to #plainLocator.
   */
  static locatorEquals(loc1: string, loc2: string): boolean {
    return this.plainLocator(loc1) === this.plainLocator(loc2);
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
  static notificationPath(notification: Notification): string {
    switch (notification.entityType) {
      case NotificationEntityTypeEnum.USER:
        return `/users/${notification.entityId}/profile`;
      case NotificationEntityTypeEnum.TRANSACTION:
        if (notification.type === NotificationTypeEnum.FEEDBACK_OPTIONAL ||
          notification.type === NotificationTypeEnum.FEEDBACK_EXPIRATION_REMINDER ||
          notification.type === NotificationTypeEnum.FEEDBACK_REQUIRED) {
          return `/users/feedbacks/set/${notification.entityId}`;
        }
        return `/banking/transaction/${notification.entityId}`;
      case NotificationEntityTypeEnum.TRANSFER:
        return `/banking/transfer/${notification.entityId}`;
      case NotificationEntityTypeEnum.MARKETPLACE:
        return `/marketplace/view/${notification.entityId}`;
      case NotificationEntityTypeEnum.AD_QUESTION:
        return notification.type === NotificationTypeEnum.AD_QUESTION_ANSWERED
          ? `/marketplace/view/${notification.entityId}`
          : `/marketplace/unanswered-questions/view/${notification.entityId}`;
      case NotificationEntityTypeEnum.ORDER:
        return `/marketplace/order/${notification.entityId}`;
      case NotificationEntityTypeEnum.TOKEN:
        return `/users/tokens/view/${notification.entityId}`;
      case NotificationEntityTypeEnum.VOUCHER:
        return `/banking/vouchers/view/${notification.entityId}`;
      case NotificationEntityTypeEnum.VOUCHER_TRANSACTION:
        return `/banking/voucher-transactions/view/${notification.entityId}`;
      case NotificationEntityTypeEnum.REFERENCE:
        return `/users/references/view/${notification.entityId}`;
      case NotificationEntityTypeEnum.FEEDBACK:
        return `/users/feedbacks/view/${notification.entityId}`;
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
      case 'newUser':
      case 'user':
      case 'userProfile':
        return `/users/${id}/profile`;
      case 'orderStock':
      case 'adQuestionAnswered':
      case 'advertisement':
        return `/marketplace/view/${id}`;
      case 'password':
      case 'passwords':
        return `/personal/passwords`;
      case 'notification':
      case 'notifications':
        return `/personal/notifications`;
      case 'notificationSetting':
        return `/users/self/notification-settings`;
      case 'order':
        return `/marketplace/order/${id}`;
      case 'unansweredAdQuestion':
      case 'unansweredWebShopQuestion':
        return `/marketplace/unanswered-questions/view/${id}`;
      case 'voucher':
        return `/banking/vouchers/${id}`;
      case 'operatorProfile':
        return `/users/operators/${id}`;
      case 'record':
        return `/records/view/${id}`;
      case 'token':
        return `/users/tokens/view/${id}`;
      case 'publicUserRegistration':
        return `/users/registration`;
      default:
        return null;
    }
  }

  /**
   * Indicates whether the given access is restricted. The cases are:
   * - Should redirect to the classic frontend
   * - Expired access password
   * - Pending agreements
   * - Pending login confirmation
   * - Expired secondary password
   * - Guest from an unauthorized IP address
   */
  static isRestrictedAccess(dataForFrontend: DataForFrontend): boolean {
    if (dataForFrontend?.frontend === FrontendEnum.CLASSIC
      && !environment.standalone
      && dataForFrontend?.dataForUi?.auth?.user) {
      // Must redirect to the new frontend
      return true;
    }
    const auth = dataForFrontend?.dataForUi?.auth || {};
    return auth.expiredPassword
      || auth.pendingAgreements
      || auth.pendingSecondaryPassword
      || auth.expiredSecondaryPassword
      || auth.unauthorizedAddress;
  }

  /**
   * Opens a popup window with a given HTML content
   */
  static openPopup(content: string, width: number, height: number): Window {
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    const options =
      `top=${top},left=${left},width=${width},height=${height},` +
      'personalbar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes';

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
