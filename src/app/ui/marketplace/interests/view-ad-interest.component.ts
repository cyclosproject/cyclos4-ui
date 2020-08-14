import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdInterestView, AdKind } from 'app/api/models';
import { AdInterestsService } from 'app/api/services';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { empty } from 'app/shared/helper';
import { Menu } from 'app/ui/shared/menu';

/**
 * Displays the information about an ad interest
 */
@Component({
  selector: 'view-ad-interest',
  templateUrl: 'view-ad-interest.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewAdInterestComponent extends BaseViewPageComponent<AdInterestView> implements OnInit {
  constructor(
    injector: Injector,
    private adInterestService: AdInterestsService) {
    super(injector);
  }

  empty = empty;
  id: string;
  self: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(this.adInterestService.viewAdInterest({ id: this.id }).subscribe(data => {
      this.data = data;
    }));
  }

  onDataInitialized(data: AdInterestView) {

    this.self = this.authHelper.isSelfOrOwner(data.user);

    const actions = [];
    if (data.canEdit) {
      actions.push(
        new HeadingAction('edit', this.i18n.general.edit, () =>
          this.router.navigate(['/marketplace', 'ad-interests', 'edit', this.id]), true,
        ));
    }
    this.headingActions = actions;
  }

  resolveMenu(data: AdInterestView) {
    return this.menu.userMenu(data.user, Menu.AD_INTERESTS);
  }

  /**
   * Resolves the ad type label either advertisement or webshop
   */
  resolveKindLabel() {
    return this.data.kind === AdKind.SIMPLE ? this.i18n.ad.type.simple : this.i18n.ad.type.webshop;
  }

}
