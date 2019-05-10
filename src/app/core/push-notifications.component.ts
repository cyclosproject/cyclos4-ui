import {
  ChangeDetectionStrategy, Component, ComponentFactoryResolver,
  ComponentRef, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { Notification } from 'app/api/models';
import { NotificationService } from 'app/core/notification.service';
import { PushNotificationProvider } from 'app/core/push-notification-provider';
import { PushNotificationComponent } from 'app/core/push-notification.component';
import { first } from 'rxjs/operators';
import { LayoutService } from 'app/shared/layout.service';

/**
 * Shows dismissable push notifications
 */
@Component({
  selector: 'push-notifications',
  templateUrl: 'push-notifications.component.html',
  styleUrls: ['push-notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PushNotificationsComponent implements OnInit, PushNotificationProvider {

  @ViewChild('template', { read: ViewContainerRef }) template: ViewContainerRef;

  last: PushNotificationComponent;

  constructor(
    private notification: NotificationService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private layout: LayoutService
  ) {
  }

  ngOnInit() {
    this.notification.pushNotificationProvider = this;
  }

  show(notification: Notification) {
    if (this.layout.xxs && this.last) {
      this.last.close();
    }
    const factory = this.componentFactoryResolver.resolveComponentFactory(PushNotificationComponent);
    const componentRef = this.template.createComponent(factory) as ComponentRef<PushNotificationComponent>;
    const pushNotification = componentRef.instance;
    pushNotification.notification = notification;
    pushNotification.closed.pipe(first()).subscribe(() => {
      componentRef.destroy();
      if (this.last === pushNotification) {
        this.last = null;
      }
    });
    this.last = pushNotification;
  }

}
