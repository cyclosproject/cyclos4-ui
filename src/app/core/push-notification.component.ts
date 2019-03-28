import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  EventEmitter, HostBinding, Input, Output
} from '@angular/core';
import { Notification } from 'app/api/models';
import { Messages } from 'app/messages/messages';
import { ApiHelper } from 'app/shared/api-helper';
import { NotificationsService } from 'app/api/services';
import { first } from 'rxjs/operators';
import { ErrorHandlerService } from 'app/core/error-handler.service';

const TimeoutMillis = 6000;

/**
 * Shows a single push notification
 */
@Component({
  selector: 'push-notification',
  templateUrl: 'push-notification.component.html',
  styleUrls: ['push-notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PushNotificationComponent {

  @HostBinding('style.opacity') opacity: 1;

  private _notification: Notification;
  @Input() get notification(): Notification {
    return this._notification;
  }
  set notification(notification: Notification) {
    this._notification = notification;
    this.path = ApiHelper.notificationPath(notification);
    this.changeDetector.detectChanges();
  }

  @Output() closed = new EventEmitter<void>();

  path: string;

  private timeoutHandle: any;

  constructor(
    public messages: Messages,
    private notificationsService: NotificationsService,
    private errorHandler: ErrorHandlerService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.closed.subscribe(() => {
      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
      }
    });
    this.timeoutHandle = setTimeout(() => this.closed.emit(), TimeoutMillis);
  }

  markAsRead() {
    this.errorHandler.requestWithCustomErrorHandler(() => {
      this.notificationsService.markNotificationsAsRead({ ids: [this.notification.id] })
        .pipe(first()).subscribe(() => {
          this.closed.emit();
        });
    });
  }

}
