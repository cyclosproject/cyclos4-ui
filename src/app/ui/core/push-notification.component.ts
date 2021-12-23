import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostBinding, Inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Notification } from 'app/api/models';
import { NotificationsService } from 'app/api/services/notifications.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { LayoutService } from 'app/core/layout.service';
import { SvgIcon } from 'app/core/svg-icon';
import { I18n, I18nInjectionToken } from 'app/i18n/i18n';
import { ApiHelper } from 'app/shared/api-helper';
import { MenuService } from 'app/ui/core/menu.service';
import { ActiveMenu } from 'app/ui/shared/menu';
import { first } from 'rxjs/operators';

const TimeoutMillis = 6000;

/**
 * Shows a single push notification
 */
@Component({
  selector: 'push-notification',
  templateUrl: 'push-notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushNotificationComponent {

  SvgIcon = SvgIcon;

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
  menu: ActiveMenu;
  private timeoutHandle: any;

  constructor(
    @Inject(I18nInjectionToken) public i18n: I18n,
    public layout: LayoutService,
    private notificationsService: NotificationsService,
    private menuService: MenuService,
    private errorHandler: ErrorHandlerService,
    private changeDetector: ChangeDetectorRef,
    private router: Router,
  ) {
    this.closed.subscribe(() => {
      if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
      }
    });
    this.timeoutHandle = setTimeout(() => this.closed.emit(), TimeoutMillis);
  }

  navigate() {
    this.menuService.setActiveMenu(null);
    this.router.navigateByUrl(this.path);
    this.markAsReadAndClose();
  }

  close() {
    this.closed.emit();
  }

  private markAsReadAndClose() {
    this.errorHandler.requestWithCustomErrorHandler(() => {
      this.notificationsService.markNotificationsAsRead({ ids: [this.notification.id] })
        .pipe(first()).subscribe(() => {
          this.closed.emit();
        });
    });
  }
}
