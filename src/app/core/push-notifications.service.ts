import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { ApiConfiguration } from 'app/api/api-configuration';
import { Auth } from 'app/api/models';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { LoginState } from 'app/core/login-state';
import { LoginService } from 'app/core/login.service';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { EventSourcePolyfill } from 'ng-event-source';

export const LOGGED_OUT = 'loggedOut';
const KINDS = [LOGGED_OUT];

/**
 * Handles the registration and notitification of push events
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {

  private eventSource: EventSourcePolyfill;

  constructor(
    private dataForUiHolder: DataForUiHolder,
    private apiConfiguration: ApiConfiguration,
    private login: LoginService,
    private i18n: I18n,
    private notification: NotificationService,
    private zone: NgZone,
    private loginState: LoginState,
    private nextRequestState: NextRequestState,
    private router: Router
  ) {
  }

  public initialize() {
    console.log('Initializing push notifications service');
    this.dataForUiHolder.subscribe(dataForUi => {
      const auth = (dataForUi || {}).auth || {};
      if (auth.user == null) {
        console.log('No user - closing EventSource');
        this.close();
      } else {
        console.log('Has user - open EventSource');
        this.open(auth);
      }
    });
    if (this.login.user) {
      // Open the event source initially - there is a logged user
      this.open(this.login.auth);
    }
  }

  private open(auth: Auth) {
    if (auth == null || !auth.user) {
      return;
    }
    this.close();
    const clientId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const kinds = new Set<string>(KINDS);
    let url = this.apiConfiguration.rootUrl + '/push/subscribe?clientId=' + clientId;
    kinds.forEach(kind => url += '&kinds=' + kind);
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
  }

  private close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
