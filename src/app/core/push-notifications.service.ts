import { Injectable, NgZone } from "@angular/core";
import { EventSourcePolyfill } from 'ng-event-source';
import { LoginService } from "app/core/login.service";
import { Auth, PushNotificationEventKind, AccountWithStatus } from "app/api/models";
import { ApiConfiguration } from "app/api/api-configuration";
import { Observable } from "rxjs/Observable";
import { NotificationService } from "app/core/notification.service";
import { GeneralMessages } from "app/messages/general-messages";
import { Subscription } from "rxjs";

const KINDS: PushNotificationEventKind[] = [
  PushNotificationEventKind.LOGGED_OUT,
  PushNotificationEventKind.ACCOUNT_STATUS
];

/**
 * Handles the registration and notitification of push events
 */
@Injectable()
export class PushNotificationsService {
 
  private eventSource: EventSourcePolyfill;
  
  private accountStatusObserver;
  private accountStatus: Observable<AccountWithStatus>;

  constructor(
    private generalMessages: GeneralMessages,
    private login: LoginService,
    private notification: NotificationService,
    private zone: NgZone
    ) {
    login.subscribeForAuth(auth => {
      if (login.user) {
        this.open(auth);
      } else {
        this.close();
      }
    });
    this.accountStatus = Observable.create(observer => {
      this.accountStatusObserver = observer;
    });
    if (login.user) {
      // Open the event source initially - there is a logged user
      this.open(login.auth);
    }
  }

  /**
   * Subscribes to be notified whenever an account status has changed
   * @param callback The callback function
   */
  subscribeForAccountStatus(callback: (value: AccountWithStatus) => void): Subscription {
    return this.accountStatus.subscribe(callback);
  }

  private open(auth: Auth) {
    this.close();
    let accounts = (auth.permissions.banking || {}).accounts;
    let accountIds = accounts == null ? null : accounts.map(a => a.account.id);
    let clientId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    let kinds = new Set<PushNotificationEventKind>(KINDS);
    if (accountIds == null || accountIds.length == 0) {
      kinds.delete(PushNotificationEventKind.ACCOUNT_STATUS);
    }
    let url = ApiConfiguration.rootUrl + '/push/subscribe?clientId=' + clientId;
    kinds.forEach(kind => url += '&kinds=' + kind);
    accountIds.forEach(id => url += '&accountIds=' + id);
    this.eventSource = new EventSourcePolyfill(url, {
        headers: {'Session-Token': auth.sessionToken}
      });

    // Listen for logged out events
    this.eventSource.addEventListener(PushNotificationEventKind.LOGGED_OUT, (event: any) => {
      this.zone.run(() => {
        this.close();
        this.notification.error(this.generalMessages.errorSessionExpired());
        this.login.clear();
      });
    });

    // Listen for account status events
    this.eventSource.addEventListener(PushNotificationEventKind.ACCOUNT_STATUS, (event: any) => {
      let account = JSON.parse(event.data) as AccountWithStatus;
      this.zone.run(() => this.accountStatusObserver.next(account));
    });
  }

  private close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}