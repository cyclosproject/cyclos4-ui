import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { BrokeringLog } from 'app/api/models';
import { BrokeringActionEnum } from 'app/api/models/brokering-action-enum';
import { UserBrokersData } from 'app/api/models/user-brokers-data';
import { BrokeringService } from 'app/api/services/brokering.service';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

@Component({
  selector: 'view-broker-history',
  templateUrl: 'view-broker-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewBrokerHistoryComponent extends BaseViewPageComponent<UserBrokersData> implements OnInit {

  constructor(
    injector: Injector,
    private brokeringService: BrokeringService) {
    super(injector);
  }

  param: string;

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user;
    this.addSub(this.brokeringService.getUserBrokersData({ user: this.param, fields: ['user', 'history'] }).subscribe(data => {
      this.data = data;
    }));
  }

  showActionLabel(row: BrokeringLog) {
    switch (row.action) {
      case BrokeringActionEnum.ADD:
        return this.i18n.brokers.action.add;
      case BrokeringActionEnum.REMOVE:
        return this.i18n.brokers.action.remove;
      case BrokeringActionEnum.SET_MAIN:
        return this.i18n.brokers.action.setMain;
    }
  }

  get onClick() {
    // No op condition to disable built-in click (mobile layout)
    return (row: any) => row != null;
  }

  resolveMenu(data: UserBrokersData) {
    return this.authHelper.searchUsersMenu(data.user);
  }
}
