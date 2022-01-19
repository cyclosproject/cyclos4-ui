import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Brokering, UserBrokersData } from 'app/api/models';
import { BrokeringService } from 'app/api/services/brokering.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';

@Component({
  selector: 'list-user-brokers',
  templateUrl: 'list-user-brokers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListUserBrokersComponent
  extends BasePageComponent<UserBrokersData>
  implements OnInit {

  param: string;
  self: boolean;
  brokers: Brokering[];
  hasActions = false;

  constructor(
    injector: Injector,
    private brokeringService: BrokeringService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.param = this.route.snapshot.params.user;

    this.addSub(this.brokeringService.getUserBrokersData({ user: this.param }).subscribe(data => {
      this.data = data;
    }));
  }

  path(brokering: Brokering) {
    if (brokering.broker.id) {
      return ['/users', brokering.broker.id, 'profile'];
    }
  }

  onDataInitialized(data: UserBrokersData) {
    this.self = this.authHelper.isSelf(data.user);
    this.brokers = data.brokers;
    this.headingActions = [];
    if (data.editable) {
      this.headingActions.push(new HeadingAction(SvgIcon.PersonPlus, this.i18n.general.addNew, () =>
        this.router.navigate(['/users', this.param, 'brokers', 'new']), true));
    }
    if (data.history) {
      this.headingActions.push(new HeadingAction(SvgIcon.Clock, this.i18n.general.viewHistory, () =>
        this.router.navigate(['/users', this.param, 'brokers', 'history']), true));
    }
    this.hasActions = data.brokers.findIndex(b => this.canRemove(b)) >= 0;
  }

  get toLink() {
    return (brokering: Brokering) => this.path(brokering);
  }

  setMain(brokering: Brokering) {
    this.addSub(this.brokeringService.setMainBroker({
      broker: brokering.broker.id,
      user: this.param,
    }).subscribe(() => {
      this.reload();
    }));
  }

  remove(brokering: Brokering) {
    this.confirmation.confirm({
      message: this.i18n.general.removeConfirm(brokering.broker.display),
      callback: () => this.doRemove(brokering),
    });
  }

  private doRemove(brokering: Brokering) {
    this.addSub(this.brokeringService.removeBroker({
      broker: brokering.broker.id,
      user: this.param,
    }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(brokering.broker.display));
      this.reload();
    }));
  }

  resolveMenu() {
    return this.menu.searchUsersMenu();
  }

  canRemove(brokering: Brokering) {
    return this.data?.editable && !this.authHelper.isSelfOrOwner(brokering.broker) && brokering.broker.id;
  }

  canSetMain(brokering: Brokering) {
    return this.data?.editable && !brokering.main && brokering.broker.id;
  }

}
