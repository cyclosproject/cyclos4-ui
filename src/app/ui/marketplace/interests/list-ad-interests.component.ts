import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdInterest, UserAdInterestsListData } from 'app/api/models';
import { AdInterestsService } from 'app/api/services/ad-interests.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';

/**
 * List of advertisement interests
 */
@Component({
  selector: 'list-ad-interests',
  templateUrl: 'list-ad-interests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListAdInterestsComponent
  extends BasePageComponent<UserAdInterestsListData>
  implements OnInit {

  self: boolean;
  param: string;

  constructor(
    injector: Injector,
    private adInterestService: AdInterestsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || this.ApiHelper.SELF;

    this.addSub(this.adInterestService.getUserAdInterestsListData({ user: this.param }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: UserAdInterestsListData) {

    this.self = this.authHelper.isSelfOrOwner(data.user);

    if (data.canCreate) {
      this.headingActions = [
        new HeadingAction(SvgIcon.PlusCircle, this.i18n.general.addNew, () => {
          this.router.navigate(['/marketplace', this.param, 'ad-interests', 'new']);
        }, true),
      ];
    }
  }

  viewPath(adInterest: AdInterest) {
    return ['/marketplace', 'ad-interests', 'view', adInterest.id];
  }

  get toLink() {
    return (adInterest: AdInterest) => this.viewPath(adInterest);
  }

  remove(adInterest: AdInterest) {
    this.notification.confirm({
      message: this.i18n.general.removeConfirm(adInterest.name),
      callback: () => this.doRemove(adInterest),
    });
  }

  private doRemove(adInterest: AdInterest) {
    this.addSub(this.adInterestService.deleteAdInterest({ id: adInterest.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(adInterest.name));
      this.reload();
    }));
  }

  resolveMenu(data: UserAdInterestsListData) {
    return this.menu.userMenu(data.user, Menu.AD_INTERESTS);
  }
}
