import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Notification, QueryFilters } from 'app/api/models';
import { NotificationsService } from 'app/api/services/notifications.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { forkJoin, Observable } from 'rxjs';
import { first, skip } from 'rxjs/operators';

type NotificationSearchParams = QueryFilters & { onlyUnread: boolean };

/**
 * Displays a search for notifications
 */
@Component({
  selector: 'search-notifications',
  templateUrl: 'search-notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchNotificationsComponent
  extends BaseSearchPageComponent<any, NotificationSearchParams, Notification>
  implements OnInit
{
  constructor(injector: Injector, private notificationsService: NotificationsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    // Update the data with any non-null value, so the search page is properly initialized
    this.data = {};

    // Send a background request indicating the last time notifications were viewed
    this.addSub(
      this.notificationsService
        .updateLastViewDateForNotifications()
        .pipe(first())
        .subscribe(() => {
          // And then immediately update the current notifications status
          const status$ = this.notification.notificationsStatus$;
          const status = { ...status$.value };
          status.lastViewDate = this.dataForFrontendHolder.now().toISOString();
          status.newNotifications = 0;
          status$.next(status);
          // Whenever a new notification arrives, update the list
          // Skip first subscription invocation to avoid duplicate initial search
          this.addSub(this.notification.notificationsStatus$.pipe(skip(1)).subscribe(() => this.update()));
        })
    );

    const settingsAction = this.dataForFrontendHolder.auth?.permissions?.notificationSettings?.enable
      ? new HeadingAction(
          SvgIcon.Gear,
          this.i18n.notification.actions.settings,
          () => {
            this.router.navigate(['/users', ApiHelper.SELF, 'notification-settings']);
          },
          true
        )
      : null;
    if (settingsAction) {
      this.headingActions = [settingsAction];
    }
    // Update the heading actions with the mark all as read if there's any unread notifications
    this.addSub(
      this.results$.subscribe(results => {
        const notifications = (results ? results.results : null) || [];
        const unread = notifications.filter(n => !n.read);
        const updateActions = () => {
          const headingActions = [];
          if (unread.length > 0) {
            headingActions.push(
              new HeadingAction(SvgIcon.Check2All, this.i18n.notification.actions.markAllRead, () => this.markAllRead())
            );
          }
          if (notifications.length > 0) {
            headingActions.push(
              new HeadingAction(SvgIcon.Trash, this.i18n.notification.actions.removeAll, () => this.removeAll())
            );
          }
          if (settingsAction) {
            headingActions.push(settingsAction);
          }
          this.headingActions = headingActions;
        };
        updateActions();
        this.addSub(this.layout.breakpointChanges$.subscribe(updateActions));
      })
    );
  }

  rowClick(notification: Notification) {
    // Mark as read
    this.addSub(this.notificationsService.markNotificationsAsRead({ ids: [notification.id] }).subscribe());

    // If a known path, navigate
    const path = this.path(notification);
    if (path) {
      this.router.navigateByUrl(path);
    }
  }

  remove(notification: Notification) {
    this.addSub(this.notificationsService.deleteNotification({ id: notification.id }).subscribe(() => this.update()));
  }

  path(notification: Notification) {
    return ApiHelper.notificationPath(notification);
  }

  markAllRead() {
    this.addSub(this.notificationsService.markNotificationsAsRead({ ids: this.ids }).subscribe(() => this.update()));
  }

  removeAll() {
    const observables: Observable<any>[] = [];
    for (const id of this.ids) {
      observables.push(this.notificationsService.deleteNotification({ id }));
    }
    this.addSub(
      forkJoin(observables)
        .pipe(first())
        .subscribe(() => this.update())
    );
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

  protected toSearchParams(value: any): NotificationSearchParams {
    return value;
  }
  protected doSearch(value: NotificationSearchParams): Observable<HttpResponse<Notification[]>> {
    return this.notificationsService.searchNotifications$Response(value);
  }

  get onClick() {
    return (row: Notification) => this.rowClick(row);
  }

  resolveMenu() {
    return Menu.NOTIFICATIONS;
  }
}
