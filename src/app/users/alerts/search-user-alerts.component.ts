import { ChangeDetectionStrategy, Component, OnInit, Injector } from '@angular/core';
import { UserAlert } from 'app/api/models/user-alert';
import { AlertsService } from 'app/api/services/alerts.service';
import { UserAlertDataForSearch } from 'app/api/models/user-alert-data-for-search';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { UserAlertQueryFilters } from 'app/api/models';
import { ApiHelper } from 'app/shared/api-helper';
import { Menu } from 'app/shared/menu';


@Component({
  selector: 'search-user-alerts',
  templateUrl: 'search-user-alerts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
      user: value.user
    };
  }

  doSearch(value: UserAlertQueryFilters) {
    return this.alertsService.searchUserAlerts$Response(value);
  }

  resolveMenu() {
    return Menu.USER_ALERTS;
  }
}
