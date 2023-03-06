import { Injectable } from '@angular/core';
import { NotificationsStatus } from 'app/api/models';
import { NotificationsService } from 'app/api/services/notifications.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { NextRequestState } from 'app/core/next-request-state';
import { PushNotificationProvider } from 'app/core/push-notification-provider';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { NotificationType } from 'app/shared/notification-type';
import { NotificationComponent } from 'app/shared/notification.component';
import { SnackBarOptions, SnackBarProvider } from 'app/shared/snack-bar-provider';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

/**
 * Reference to a notification
 */
export class NotificationRef {
  private _sub: Subscription;
  private _onClosed = new Subject<void>();

  constructor(
    private _ref: BsModalRef,
    onClosed: Observable<NotificationComponent>) {
    this._sub = onClosed.subscribe(other => {
      if (this.notification === other) {
        this._onClosed.next(null);
        this._onClosed.complete();
        this._sub.unsubscribe();
      }
    });
  }

  get onClosed(): Observable<void> {
    return this._onClosed.asObservable();
  }

  get notification(): NotificationComponent {
    return this._ref.content;
  }

  close() {
    this._ref.hide();
  }
}

/**
 * Service used to manage notifications being displayed for users
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  /** The currently open notification */
  private currentNotification: NotificationRef;

  private _snackBarProvider: SnackBarProvider;
  set snackBarProvider(provider: SnackBarProvider) {
    this._snackBarProvider = provider;
  }

  private _pushNotificationProvider: PushNotificationProvider;
  set pushNotificationProvider(provider: PushNotificationProvider) {
    this._pushNotificationProvider = provider;
  }

  onClosed = new Subject<NotificationComponent>();

  notificationsStatus$ = new BehaviorSubject<NotificationsStatus>(null);

  constructor(
    private modal: BsModalService,
    nextRequestState: NextRequestState,
    pushNotifications: PushNotificationsService,
    notificationsService: NotificationsService,
    dataForFrontendHolder: DataForFrontendHolder,
  ) {
    this.modal.onHidden.subscribe(() => {
      if (this.currentNotification) {
        this.onClosed.next(this.currentNotification.notification);
        this.currentNotification = null;
      }
    });
    // Subscribe for user changes: update the notification status
    dataForFrontendHolder.subscribe(dataForFrontend => {
      const dataForUi = (dataForFrontend || {}).dataForUi;
      const auth = (dataForUi || {}).auth || {};
      if (auth.user && ((auth.permissions || {}).notifications || {}).enable) {
        nextRequestState.ignoreNextError = true;
        notificationsService.notificationsStatus().pipe(first()).subscribe(status => {
          this.notificationsStatus$.next(status);
        });
        this.notificationsStatus$.next(null);
      } else {
        this.notificationsStatus$.next(null);
      }
    });

    // Subscribe for notification pushes
    pushNotifications.newNotifications$.subscribe(event => {
      this.notificationsStatus$.next(event);
      this._pushNotificationProvider.show(event.notification);
    });
  }

  /**
   * Shows a snack bar message (quick message on the bottom)
   */
  snackBar(message: string, options?: SnackBarOptions): void {
    this._snackBarProvider.show(message, options);
  }

  /**
   * Shows an error notification
   * @param message The notification message
   * @returns The dialog reference
   */
  error(message: string, allowClose = true): NotificationRef {
    return this.showNotification(NotificationType.ERROR, message, allowClose);
  }

  /**
   * Shows a warning notification
   * @param message The notification message
   * @returns The dialog reference
   */
  warning(message: string, allowClose = true, backdrop = true): NotificationRef {
    return this.showNotification(NotificationType.WARNING, message, allowClose, backdrop);
  }

  /**
   * Shows an information notification
   * @param message The notification message
   * @returns The dialog reference
   */
  info(message: string, allowClose = true, backdrop = true): NotificationRef {
    return this.showNotification(NotificationType.INFO, message, allowClose, backdrop);
  }

  /**
   * Shows a notification with the given type
   * @param type The notification type to show
   * @param message The notification message
   * @returns The dialog reference
   */
  showNotification(type: NotificationType, message: string, allowClose = true, backdrop = true): NotificationRef {
    // Close the current notification, if any
    this.close();

    const modalRef = this.modal.show(NotificationComponent, {
      class: 'notification',
      initialState: {
        type,
        message,
        allowClose,
      },
    });
    if (!backdrop) {
      this.modal.removeBackdrop();
    }

    // Store the currently opened notification
    this.currentNotification = new NotificationRef(modalRef, this.onClosed);
    return this.currentNotification;
  }

  /**
   * Closes the currently visible notification, if any
   */
  close(): void {
    if (this.currentNotification) {
      this.currentNotification.close();
    }
  }
}
