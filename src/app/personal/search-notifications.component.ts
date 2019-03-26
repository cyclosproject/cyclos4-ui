import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Notification, NotificationEntityTypeEnum } from 'app/api/models';
import { NotificationsService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Observable } from 'rxjs';
import { HeadingAction } from 'app/shared/action';


/**
 * Displays a search for notifications
 */
@Component({
  selector: 'search-notifications',
  templateUrl: 'search-notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchNotificationsComponent
  extends BaseSearchPageComponent<any, Notification>
  implements OnInit {

  constructor(
    injector: Injector,
    private notificationsService: NotificationsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.data = {};
    this.addSub(this.results$.subscribe(results => {
      const headingActions = [];
      const items = (results ? results.results : null) || [];
      if (items.length > 0) {
        headingActions.push(new HeadingAction('done_all', this.messages.notification.actions.markAllRead, () => this.markAllRead()));
      }
      this.headingActions = headingActions;
    }));
  }

  onClick(notification: Notification) {
    // Mark as read
    this.addSub(this.notificationsService.markNotificationsAsRead({ ids: [notification.id] }).subscribe());

    // If a known path, navigate
    const path = this.path(notification);
    if (path) {
      this.router.navigate(path);
    }
  }

  remove(notification: Notification) {
    this.addSub(this.notificationsService.deleteNotification({ id: notification.id })
      .subscribe(() => this.update()));
  }

  path(notification: Notification) {
    switch (notification.entityType) {
      case NotificationEntityTypeEnum.USER:
        return ['users', 'profile', notification.entityId];
      case NotificationEntityTypeEnum.TRANSACTION:
        return ['banking', 'transaction', notification.entityId];
      case NotificationEntityTypeEnum.TRANSFER:
        return ['banking', 'transfer', notification.entityId];
    }
    return undefined;
  }

  markAllRead() {
    const ids = this.results.results.map(n => n.id);
    this.addSub(this.notificationsService.markNotificationsAsRead({ ids: ids })
      .subscribe(() => this.update()));
  }

  protected getFormControlNames(): string[] {
    return ['onlyUnread'];
  }

  protected doSearch(value: any): Observable<HttpResponse<Notification[]>> {
    return this.notificationsService.searchNotifications$Response(value);
  }

}
