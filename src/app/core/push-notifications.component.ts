import {
  ChangeDetectionStrategy, Component, ComponentFactoryResolver,
  ComponentRef, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { Notification } from 'app/api/models';
import { NotificationService } from 'app/core/notification.service';
import { PushNotificationProvider } from 'app/core/push-notification-provider';
import { PushNotificationComponent } from 'app/core/push-notification.component';
import { first } from 'rxjs/operators';

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

  constructor(
    private notification: NotificationService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
  }

  ngOnInit() {
    this.notification.pushNotificationProvider = this;
  }

  show(notification: Notification) {
    const factory = this.componentFactoryResolver.resolveComponentFactory(PushNotificationComponent);
    const componentRef = this.template.createComponent(factory) as ComponentRef<PushNotificationComponent>;
    const pushNotification = componentRef.instance;
    pushNotification.notification = notification;
    pushNotification.closed.pipe(first()).subscribe(() => componentRef.destroy());
  }

}
