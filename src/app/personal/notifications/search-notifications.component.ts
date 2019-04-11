import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Notification } from 'app/api/models';
import { NotificationsService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Observable, forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';


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

    // Whenever a new notification arrives, update the list
    this.addSub(this.notification.notificationsStatus$.subscribe(() => this.update()));

    // Update the data with any non-null value, so the search page is properly initialized
    this.data = {};

    // Send a background request indicating the last time notifications were viewed
    this.notificationsService.markAsViewed().pipe(first()).subscribe(() => {
      // And then immediately update the current notifications status
      const status$ = this.notification.notificationsStatus$;
      const status = { ...status$.value };
      status.lastViewDate = this.dataForUiHolder.now().toISOString();
      status.newNotifications = 0;
      status$.next(status);
    });

    // Update the heading actions with the mark all as read if there's any unread notifications
    this.addSub(this.results$.subscribe(results => {
      const headingActions = [];
      const notifications = ((results ? results.results : null) || []);
      const unread = notifications.filter(n => !n.read);
      if (unread.length > 0) {
        headingActions.push(new HeadingAction('done_all', this.i18n.notification.actions.markAllRead, () => this.markAllRead()));
      }
      if (notifications.length > 0) {
        headingActions.push(new HeadingAction('clear', this.i18n.notification.actions.removeAll, () => this.removeAll()));
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
      this.router.navigateByUrl(path);
    }
  }

  remove(notification: Notification) {
    this.addSub(this.notificationsService.deleteNotification({ id: notification.id })
      .subscribe(() => this.update()));
  }

  path(notification: Notification) {
    return ApiHelper.notificationPath(notification);
  }

  markAllRead() {
    this.addSub(this.notificationsService.markNotificationsAsRead({ ids: this.ids })
      .subscribe(() => this.update()));
  }

  removeAll() {
    const observables: Observable<any>[] = [];
    for (const id of this.ids) {
      observables.push(this.notificationsService.deleteNotification({ id: id }));
    }
    forkJoin(observables).pipe(first()).subscribe(() => this.update());
  }

  get ids(): string[] {
    if (this.results && this.results.results) {
      return this.results.results.map(n => n.id);
    } else {
      return [];
    }
  }

  protected getFormControlNames(): string[] {
    return ['onlyUnread'];
  }

  protected doSearch(value: any): Observable<HttpResponse<Notification[]>> {
    return this.notificationsService.searchNotifications$Response(value);
  }

}
