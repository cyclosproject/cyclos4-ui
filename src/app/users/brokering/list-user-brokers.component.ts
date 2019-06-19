import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserBrokersData, Brokering } from 'app/api/models';
import { BrokeringService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { HeadingAction } from 'app/shared/action';

@Component({
  selector: 'list-user-brokers',
  templateUrl: 'list-user-brokers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListUserBrokersComponent
  extends BasePageComponent<UserBrokersData>
  implements OnInit {

  param: string;
  self: boolean;
  brokers: Brokering[];

  constructor(
    injector: Injector,
    private brokeringService: BrokeringService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.user || this.ApiHelper.SELF;
    this.self = this.authHelper.isSelf(this.param);

    this.addSub(this.brokeringService.getUserBrokersData({ user: this.param }).subscribe(data => {
      this.data = data;
    }));
  }

  path(brokering: Brokering) {
    return ['/users', brokering.broker.id, 'profile'];
  }

  onDataInitialized(data: UserBrokersData) {
    this.brokers = data.brokers;
    if (data.editable) {
      this.headingActions.push(new HeadingAction('registration', this.i18n.general.addNew, () =>
        this.router.navigate(['/users', this.param, 'brokers', 'new']), true));
    }
    if (data.history) {
      this.headingActions.push(new HeadingAction('history', this.i18n.general.viewHistory, () =>
        this.router.navigate(['/users', this.param, 'brokers', 'history']), true));
    }
  }

  get toLink() {
    return (brokering: Brokering) => this.path(brokering);
  }

  setMain(brokering: Brokering) {
    this.addSub(this.brokeringService.setMainBroker({
      broker: brokering.broker.id,
      user: this.param
    }).subscribe(() => {
      this.reload();
    }));
  }

  remove(brokering: Brokering) {
    this.notification.confirm({
      message: this.i18n.general.removeConfirm(brokering.broker.shortDisplay),
      callback: () => this.doRemove(brokering)
    });
  }

  private doRemove(brokering: Brokering) {
    this.addSub(this.brokeringService.removeBroker({
      broker: brokering.broker.id,
      user: this.param
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(brokering.broker.shortDisplay));
      this.reload();
    }));
  }
}
