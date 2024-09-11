import { Injectable, NgZone } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import {
  DeviceConfirmationView,
  IdentityProviderCallbackResult,
  NewMessagePush,
  NewNotificationPush,
  PushNotificationEventKind,
  TransactionView
} from 'app/api/models';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { NextRequestState } from 'app/core/next-request-state';
import { randomString, urlJoin } from 'app/shared/helper';
import { EventSourcePolyfill } from 'ng-event-source';
import { of, Subject } from 'rxjs';

type MessageType = 'is-master-request' | 'is-master-response' | 'set-master' | 'data';

interface Message {
  type: MessageType;
  from: string;
  to: string;
  data: any;
}

/**
 * Handles the registration and notitification of push events.
 * When logged-in, will synchronize all browser tabs to have a single
 * EventSource.
 */
@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private clientId: string;
  private id: string;
  private masterId: string;
  private isOpen = false;

  private channel: BroadcastChannel;
  private eventSource: EventSourcePolyfill;
  private eventSourceListeners = new Map<PushNotificationEventKind, EventListener>();

  loggedOut$ = new Subject<void>();
  permissionsChanged$ = new Subject<void>();
  newNotifications$ = new Subject<NewNotificationPush>();
  newMessages$ = new Subject<NewMessagePush>();
  deviceConfirmations$ = new Subject<DeviceConfirmationView>();
  identityProviderCallback$ = new Subject<IdentityProviderCallbackResult>();
  ticket$ = new Subject<TransactionView>();
  private subjectsPerType = new Map<PushNotificationEventKind, Subject<any>>();

  constructor(
    private apiConfiguration: ApiConfiguration,
    private zone: NgZone,
    private dataForFrontendHolder: DataForFrontendHolder,
    private nextRequestState: NextRequestState
  ) {
    dataForFrontendHolder.registerLoadHook(d => {
      if (d?.development) {
        console.log(`Push notifications id = ${this.id}`);
      }
      return of(d);
    });

    try {
      this.channel = new BroadcastChannel('push-notifications');
      this.channel.onmessage = msg => {
        this.onMessage(msg.data);
      };
      window.addEventListener('unload', () => {
        if (this.isMaster) {
          this.closeEventSource();
          this.setMaster(null);
        }
      });

      this.id = randomString(16) + '_' + new Date().getTime();

      // The clientId is reused
      if (localStorage) {
        this.clientId = localStorage.getItem('pushNotificationsClientId');
      }
      if (!this.clientId) {
        this.clientId = randomString(32);
        if (localStorage) {
          localStorage.setItem('pushNotificationsClientId', this.clientId);
        }
      }
    } catch (e) {
      // BroadcastChannel is not supported
      this.clientId = randomString(32) + '_' + new Date().getTime();
    }

    // Setup the subjects per event kind
    this.subjectsPerType.set(PushNotificationEventKind.LOGGED_OUT, this.loggedOut$);
    this.subjectsPerType.set(PushNotificationEventKind.PERMISSIONS_CHANGED, this.permissionsChanged$);
    this.subjectsPerType.set(PushNotificationEventKind.NEW_NOTIFICATION, this.newNotifications$);
    this.subjectsPerType.set(PushNotificationEventKind.NEW_MESSAGE, this.newMessages$);
    this.subjectsPerType.set(PushNotificationEventKind.DEVICE_CONFIRMATION, this.deviceConfirmations$);
    this.subjectsPerType.set(PushNotificationEventKind.IDENTITY_PROVIDER_CALLBACK, this.identityProviderCallback$);
    this.subjectsPerType.set(PushNotificationEventKind.TICKET, this.ticket$);
  }

  /**
   * Opens the stream. Must be called when there's a logged user
   */
  openForIdentityProviderCallback(requestId: string) {
    // Close the normal synchronization, if any
    this.close();
    // Open the EventSource only for identity provider
    const url =
      urlJoin(this.apiConfiguration.rootUrl, 'push', 'subscribe') +
      `?clientId=${this.clientId}&kinds=` +
      PushNotificationEventKind.IDENTITY_PROVIDER_CALLBACK +
      `&identityProviderRequestId=${requestId}`;
    this.eventSource = new EventSourcePolyfill(url, {
      headers: this.nextRequestState.headers
    });
    this.setupListener(PushNotificationEventKind.IDENTITY_PROVIDER_CALLBACK, true);
  }

  close() {
    if (this.isOpen) {
      this.isOpen = false;
      // Close the event source
      this.closeEventSource();

      if (this.supportsSync() && this.isMaster) {
        // When was master, send to everyone that the master has closed
        this.setMaster(null);
      }
    }
  }

  getClientId() {
    return this.clientId;
  }

  open(): void {
    if (!this.isOpen) {
      this.isOpen = true;

      if (this.supportsSync()) {
        // Synchronization is supported: if no master is known, elect a new one
        if (this.masterId == null) {
          this.electMaster();
        } else {
          this.openEventSource();
        }
      } else {
        // Synchronization is not supported - open the event source directly
        this.openEventSource();
      }
    }
  }

  publishLogout() {
    this.publishData(PushNotificationEventKind.LOGGED_OUT, null);
  }

  supportsSync() {
    return this.channel != null;
  }

  /**
   * Generates a log if in development mode
   */
  private logIfDevelopment(messageGetter: () => string) {
    if (this.isDevelopment) {
      console.log(messageGetter());
    }
  }

  private get isDevelopment() {
    return this.dataForFrontendHolder.dataForFrontend?.development;
  }

  private closeEventSource() {
    if (this.eventSource != null) {
      this.logIfDevelopment(() => 'Closing event source');
      for (let e of this.eventSourceListeners.entries()) {
        this.eventSource.removeEventListener(e[0], e[1]);
      }
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Master election has the following steps:
   * - Send a IS_MASTER_REQUEST message to all nodes
   * - Each node reply with IS_MASTER_RESPONSE, indicating if is currently the master
   * - Store the master id of the node that replied it's the master
   * - After a random time between 200 and 1000 ms, if no node is master, promote self as master
   */
  private electMaster() {
    this.logIfDevelopment(() => 'Electing master');

    this.post('is-master-request');

    setTimeout(() => {
      if (!this.masterId) {
        this.logIfDevelopment(() => 'No master replied. Promoting self.');
        this.setMaster(this.id);
      }
    }, 200 + Math.random() * 800);
  }

  private get isMaster() {
    return this.id === this.masterId;
  }

  private onData(data: any) {
    var type = data.type;
    const subject = this.subjectsPerType.get(type);
    if (subject) {
      subject.next(data.data);
    } else {
      console.error(`No subject for push notification type ${type}`);
    }
  }

  private onIsMasterRequest(from: string) {
    this.post('is-master-response', { master: this.isMaster }, from);
  }

  private onIsMasterResponse(from: string, master: boolean) {
    if (master) {
      this.masterId = from;
    }
  }

  private onMessage(message: Message) {
    if (message.to && message.to !== this.id) {
      // A message to someone else - ignore it
      return;
    }
    switch (message.type) {
      case 'is-master-request':
        this.onIsMasterRequest(message.from);
        break;
      case 'is-master-response':
        this.onIsMasterResponse(message.from, message.data.master);
        break;
      case 'set-master':
        this.onSetMaster(message.data.masterId);
        break;
      case 'data':
        this.onData(message.data);
        break;
    }
  }

  private onSetMaster(masterId: string) {
    this.logIfDevelopment(() => `Setting master to ${masterId}`);
    const wasMaster = this.isMaster;
    if (wasMaster && this.id !== masterId && this.eventSource) {
      // No longer the master - close the event source
      this.logIfDevelopment(() => `Closing the event source, as ${masterId} is now the master`);
      this.closeEventSource();
    }
    this.masterId = masterId;
    if (this.isMaster && this.isOpen) {
      // If now the master, open the event source
      this.openEventSource();
    } else if (!masterId) {
      // When no master, elect a new one
      this.electMaster();
    }
  }

  private openEventSource() {
    this.closeEventSource();

    this.logIfDevelopment(() => 'Opening EventSource');

    const types = [...this.subjectsPerType.keys()];

    // Open the event source
    let url = urlJoin(this.apiConfiguration.rootUrl, 'push', 'subscribe') + '?clientId=' + this.clientId;
    types.forEach(kind => (url += '&kinds=' + kind));
    this.eventSource = new EventSourcePolyfill(url, {
      headers: this.nextRequestState.headers
    });

    // Setup the event source listeners

    for (const type of this.subjectsPerType.keys()) {
      this.setupListener(type);
    }
  }

  private setupListener(kind: PushNotificationEventKind, local = false) {
    const listener = (event: any) => {
      this.zone.run(() => {
        this.publishData(kind, event, local);
      });
    };
    this.eventSource.addEventListener(kind, listener);
    this.eventSourceListeners.set(kind, listener);
  }

  private post(type: MessageType, data?: any, to?: string) {
    const message = { type, from: this.id, to, data };

    // Post on the channel
    this.channel.postMessage(message);

    // Also handle the message locally
    this.onMessage(message);
  }

  private publishData(type: PushNotificationEventKind, event: MessageEvent<any>, local = false) {
    const data = typeof event?.data === 'string' ? JSON.parse(event.data) : event?.data;
    if (this.isDevelopment && data) {
      console.log(`Publishing push notification of type ${type} (local: ${local})`);
      console.dir(data);
    }

    if (local) {
      this.onData({ type, data });
    } else {
      this.post('data', { type, data });
    }
  }

  private setMaster(masterId: string) {
    this.masterId = masterId;
    this.post('set-master', { masterId });
  }
}
