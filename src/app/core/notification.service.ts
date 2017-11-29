import { Injectable } from '@angular/core';
import { Notification } from 'app/shared/notification';
import { NotificationType } from 'app/shared/notification-type';
import { MatDialog, MatDialogRef } from '@angular/material';
import { NotificationComponent } from 'app/shared/notification.component';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Service used to manage notifications being displayed for users
 */
@Injectable()
export class NotificationService {
  constructor(
    private dialog: MatDialog
  ) { }

  /**
   * Shows an error notification
   * @param message The notification message
   * @returns The dialog reference
   */
  error(message: string, allowClose = true): Observable<MatDialogRef<NotificationComponent>> {
    return this.showNotification(NotificationType.ERROR, message, allowClose);
  }

  /**
   * Shows a warning notification
   * @param message The notification message
   * @returns The dialog reference
   */
  warning(message: string, allowClose = true): Observable<MatDialogRef<NotificationComponent>> {
    return this.showNotification(NotificationType.WARNING, message, allowClose);
  }

  /**
   * Shows an information notification
   * @param message The notification message
   * @returns The dialog reference
   */
  info(message: string, allowClose = true): Observable<MatDialogRef<NotificationComponent>> {
    return this.showNotification(NotificationType.INFO, message, allowClose);
  }

  /**
   * Shows a notification with the given type
   * @param type The notification type to show
   * @param message The notification message
   * @returns The dialog reference
   */
  showNotification(type: NotificationType, message: string, allowClose = true):
    Observable<MatDialogRef<NotificationComponent>> {
    const result = new BehaviorSubject<MatDialogRef<NotificationComponent>>(null);
    const open = () => {
      const ref = this.dialog.open(NotificationComponent, {
        disableClose: !allowClose
      });
      const component = ref.componentInstance;
      component.notification = new Notification(type, message);
      component.allowClose = allowClose;
      result.next(ref);
    };
    window.setTimeout(open, 100);
    return result.asObservable();
  }

  /**
   * Closes the currently visible notification, if any
   */
  close(): void {
    this.dialog.closeAll();
  }
}
