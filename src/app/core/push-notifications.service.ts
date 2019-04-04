import { Injectable, NgZone } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { DeviceConfirmationView, Notification, NotificationsStatus } from 'app/api/models';
import { NextRequestState } from 'app/core/next-request-state';
import { EventSourcePolyfill } from 'ng-event-source';
import { Subject } from 'rxjs';

export const LoggedOut = 'loggedOut';
export const NewNotification = 'newNotification';
export const DeviceConfirmation = 'deviceConfirmation';
const Kinds = [LoggedOut, NewNotification, DeviceConfirmation];

export type NewNotificationPush = NotificationsStatus & { notification: Notification };

/**
 * Handles the registration and notitification of push events
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {

  private eventSource: EventSourcePolyfill;

  public loggedOut$ = new Subject<void>();
  public newNotifications$ = new Subject<NewNotificationPush>();
  public deviceConfirmations$ = new Subject<DeviceConfirmationView>();

  constructor(
    private apiConfiguration: ApiConfiguration,
    private zone: NgZone,
    private nextRequestState: NextRequestState
  ) {
  }

  /**
   * Opens the stream
   */
  open() {
    if (this.eventSource) {
      // Already opened
      return;
    }
    const clientId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const kinds = new Set<string>(Kinds);
    let url = this.apiConfiguration.rootUrl + '/push/subscribe?clientId=' + clientId;
    kinds.forEach(kind => url += '&kinds=' + kind);
    this.eventSource = new EventSourcePolyfill(url, {
      headers: this.nextRequestState.headers
    });

    // Listen for logged-out events
    this.eventSource.addEventListener(LoggedOut, () => {
      this.zone.run(() => {
        this.close();
        this.loggedOut$.next();
      });
    });

    // Listen for new notification events
    this.eventSource.addEventListener(NewNotification, (event: any) => {
      this.zone.run(() => {
        const status = JSON.parse(event.data) as NewNotificationPush;
        this.newNotifications$.next(status);
      });
    });

    // Listen for new device confirmation events
    this.eventSource.addEventListener(DeviceConfirmation, (event: any) => {
      this.zone.run(() => {
        const confirmation = JSON.parse(event.data) as DeviceConfirmationView;
        this.deviceConfirmations$.next(confirmation);
      });
    });
  }

  /**
   * Closes the stream
   */
  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
