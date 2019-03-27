import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Notification, NotificationsStatus } from 'app/api/models';
import { LoginService } from 'app/core/login.service';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { Messages } from 'app/messages/messages';
import { EventSourcePolyfill } from 'ng-event-source';

export const LOGGED_OUT = 'loggedOut';
export const NEW_NOTIFICATION = 'newNotification';
const KINDS = [LOGGED_OUT, NEW_NOTIFICATION];

/**
 * Handles the registration and notitification of push events
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {

  private eventSource: EventSourcePolyfill;

  constructor(
    private apiConfiguration: ApiConfiguration,
    private login: LoginService,
    private messages: Messages,
    private notification: NotificationService,
    private zone: NgZone,
    private nextRequestState: NextRequestState,
    private router: Router
  ) {
  }

  initialize() {
    this.login.user$.subscribe(user => {
      if (user) {
        this.open();
      } else {
        this.close();
      }
    });
    if (this.login.user) {
      // Open the event source initially - there is a logged user
      this.open();
    }
  }

  private open() {
    this.close();
    const clientId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const kinds = new Set<string>(KINDS);
    let url = this.apiConfiguration.rootUrl + '/push/subscribe?clientId=' + clientId;
    kinds.forEach(kind => url += '&kinds=' + kind);
    this.eventSource = new EventSourcePolyfill(url, {
      headers: this.nextRequestState.headers
    });

    // Listen for new notification events
    this.eventSource.addEventListener(NEW_NOTIFICATION, (event: any) => {
      this.zone.run(() => {
        const status = JSON.parse(event.data) as NotificationsStatus & { notification: Notification };
        this.notification.notificationsStatus$.next(status);
        this.notification.newNotificationPush(status.notification);
      });
    });

    // Listen for logged out events
    this.eventSource.addEventListener(LOGGED_OUT, () => {
      this.zone.run(() => {
        this.close();
        if (this.login.user == null || this.login.loggingOut) {
          return;
        }
        this.login.clear();
        this.nextRequestState.setSessionToken(null);
        this.notification.confirm({
          title: this.messages.general.sessionExpired.title,
          message: this.messages.general.sessionExpired.message,
          confirmLabel: this.messages.general.sessionExpired.loginAgain,
          callback: () => {
            this.login.goToLoginPage(this.router.url);
          }
        });
      });
    });
  }

  private close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
