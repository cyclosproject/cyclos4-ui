import { Injectable, NgZone } from '@angular/core';
import { EventSourcePolyfill } from 'ng-event-source';
import { LoginService } from 'app/core/login.service';
import { Auth, AccountWithStatus } from 'app/api/models';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Observable } from 'rxjs';
import { NotificationService } from 'app/core/notification.service';
import { Subscription } from 'rxjs';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { LoginState } from 'app/core/login-state';
import { Router } from '@angular/router';
import { NextRequestState } from 'app/core/next-request-state';
import { empty } from 'app/shared/helper';

export const LOGGED_OUT = 'loggedOut';
export const ACCOUNT_STATUS = 'accountStatus';

const KINDS = [LOGGED_OUT, ACCOUNT_STATUS];

/**
 * Handles the registration and notitification of push events
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {

  private eventSource: EventSourcePolyfill;

  private accountStatusObserver;
  private accountStatus: Observable<AccountWithStatus>;

  constructor(
    dataForUiHolder: DataForUiHolder,
    private apiConfiguration: ApiConfiguration,
    private login: LoginService,
    private i18n: I18n,
    private notification: NotificationService,
    private zone: NgZone,
    private loginState: LoginState,
    private nextRequestState: NextRequestState,
    private router: Router
  ) {
    dataForUiHolder.subscribe(dataForUi => {
      const auth = (dataForUi || {}).auth;
      if (auth == null) {
        this.close();
      } else {
        this.open(auth);
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
    if (auth == null || !auth.user) {
      return;
    }
    this.close();
    const accounts = (auth.permissions.banking || {}).accounts;
    const accountIds = empty(accounts) ? [] : accounts.map(a => a.account.id);
    const clientId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const kinds = new Set<string>(KINDS);
    if (empty(accountIds)) {
      kinds.delete(ACCOUNT_STATUS);
    }
    let url = this.apiConfiguration.rootUrl + '/push/subscribe?clientId=' + clientId;
    kinds.forEach(kind => url += '&kinds=' + kind);
    accountIds.forEach(id => url += '&accountIds=' + id);
    this.eventSource = new EventSourcePolyfill(url, {
      headers: { 'Session-Token': auth.sessionToken }
    });

    // Listen for logged out events
    this.eventSource.addEventListener(LOGGED_OUT, () => {
      this.zone.run(() => {
        this.close();
        if (this.login.user == null) {
          return;
        }
        this.login.clear();
        this.nextRequestState.sessionToken = null;
        this.notification.confirm({
          title: this.i18n('Session expired'),
          message: this.i18n('You have been logged-out.<br>You can keep viewing the same page or login again now.'),
          confirmLabel: this.i18n('Login again'),
          callback: () => {
            this.loginState.redirectUrl = this.router.url;
            this.router.navigateByUrl('/login');
          }
        });
      });
    });

    // Listen for account status events
    this.eventSource.addEventListener(ACCOUNT_STATUS, (event: any) => {
      const account = JSON.parse(event.data) as AccountWithStatus;
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
