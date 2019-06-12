import { ChangeDetectionStrategy, Component, OnInit, Injector } from '@angular/core';
import { UserAlert } from 'app/api/models/user-alert';
import { AlertsService } from 'app/api/services/alerts.service';
import { UserAlertDataForSearch } from 'app/api/models/user-alert-data-for-search';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { BankingHelperService } from 'app/core/banking-helper.service';


@Component({
  selector: 'search-user-alerts',
  templateUrl: 'search-user-alerts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUserAlertsComponent
  extends BaseSearchPageComponent<UserAlertDataForSearch, UserAlert>
  implements OnInit {

  query: any;

  constructor(
    injector: Injector,
    private alertsService: AlertsService,
    private bankingHelper: BankingHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.data = {};
  }

  protected getFormControlNames() {
    return ['type', 'user', 'periodBegin', 'periodEnd'];
  }

  doSearch(value: any) {
    const query = {
      fields: null,
      broker: null,
      datePeriod: this.bankingHelper.resolveDatePeriod(value),
      page: value.page,
      pageSize: value.pageSize,
      types: value.type,
      user: value.user
    };

    return this.alertsService.searchUserAlerts$Response(query);
  }
}
