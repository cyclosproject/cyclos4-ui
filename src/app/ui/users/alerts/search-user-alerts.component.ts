import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserAlertQueryFilters } from 'app/api/models';
import { UserAlert } from 'app/api/models/user-alert';
import { UserAlertDataForSearch } from 'app/api/models/user-alert-data-for-search';
import { AlertsService } from 'app/api/services/alerts.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';

@Component({
  selector: 'search-user-alerts',
  templateUrl: 'search-user-alerts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchUserAlertsComponent
  extends BaseSearchPageComponent<UserAlertDataForSearch, UserAlertQueryFilters, UserAlert>
  implements OnInit {

  constructor(
    injector: Injector,
    private alertsService: AlertsService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.data = {};
  }

  protected getFormControlNames() {
    return ['types', 'user', 'beginDate', 'endDate'];
  }

  protected toSearchParams(value: any): UserAlertQueryFilters {
    return {
      datePeriod: ApiHelper.dateRangeFilter(value.beginDate, value.endDate),
      page: value.page,
      pageSize: value.pageSize,
      types: value.types,
      user: value.user,
    };
  }

  doSearch(value: UserAlertQueryFilters) {
    return this.alertsService.searchUserAlerts$Response(value);
  }

  resolveMenu() {
    return Menu.USER_ALERTS;
  }
}
