import { ChangeDetectionStrategy, Component, OnInit, Injector } from '@angular/core';
import { UserAlert } from 'app/api/models/user-alert'
import { AlertsService } from 'app/api/services/alerts.service'
import { UserAlertDataForSearch } from 'app/api/models/user-alert-data-for-search';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';

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
    private alertsService: AlertsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const query = {};
    this.form.patchValue(query, { emitEvent: false });
    this.data = {};
  }

  protected getFormControlNames() {
    return ['type', 'user', 'period'];
  }

  doSearch(value: any) {

    return this.alertsService.searchUserAlerts$Response(value);
  }
}
