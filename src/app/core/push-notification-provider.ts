import { Notification } from 'app/api/models';

/**
 * Defines the API for the push notification provider
 */
export interface PushNotificationProvider {

  /**
   * Shows the given notification
   */
  show(notification: Notification): void;

}
