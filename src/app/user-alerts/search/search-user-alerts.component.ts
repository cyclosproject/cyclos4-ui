import { ChangeDetectionStrategy, Component, OnInit, Injector } from '@angular/core';
import { UserAlert } from 'app/api/models/user-alert'
import { AlertsService } from 'app/api/services/alerts.service'
import { UserAlertDataForSearch } from 'app/api/models/user-alert-data-for-search';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { ResultType } from 'app/shared/result-type';

@Component({
  selector: 'search-user-alerts',
  templateUrl: 'search-user-alerts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchUserAlertsComponent
  extends BaseSearchPageComponent<UserAlertDataForSearch, UserAlert>
  implements OnInit {

  constructor(
    injector: Injector,
    private alertsService: AlertsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.allowedResultTypes = [ResultType.TILES, ResultType.LIST];
    this.addSub(
      this.alertsService.getUserAlertDataForSearch().subscribe(dataforSearch => {
        this.data = dataforSearch;

      })
    );
  }

  protected getFormControlNames() {
    return ['period', 'type', 'user'];
  }

  doSearch(value: any) {
    console.log('doSearch executing .............. ');
    // !!!! Ver con Andres si lleva addSub
    return this.alertsService.searchUserAlerts$Response(value);
  }
}
