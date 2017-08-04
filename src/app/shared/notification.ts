import { NotificationType } from "app/shared/notification-type";

/**
 * Contains data for a notification being displayed
 */
export class Notification {
  constructor(
    public type: NotificationType,
    public message: string) { }

  /**
   * Returns a notification with type = error and the given message
   * @param message The notification message
   */
  static error(message: string): Notification {
    return new Notification(NotificationType.ERROR, message);
  }
  /**
   * Returns a notification with type = warning and the given message
   * @param message The notification message
   */
  static warning(message: string): Notification {
    return new Notification(NotificationType.WARNING, message);
  }
  /**
   * Returns a notification with type = info and the given message
   * @param message The notification message
   */
  static into(message: string): Notification {
    return new Notification(NotificationType.INFO, message);
  }
}