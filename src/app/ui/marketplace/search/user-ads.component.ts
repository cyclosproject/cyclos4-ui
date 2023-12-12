import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdKind, AdResult, RoleEnum, UserAdsDataForSearch, UserAdsQueryFilters } from 'app/api/models';
import { MarketplaceService } from 'app/api/services/marketplace.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { ResultType } from 'app/ui/shared/result-type';
import { Observable } from 'rxjs';

type UserAdsSearchParams = UserAdsQueryFilters & { user: string; };

/**
 * Lists the advertisements of a given user
 */
@Component({
  selector: 'user-ads',
  templateUrl: 'user-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAdsComponent
  extends BaseSearchPageComponent<UserAdsDataForSearch, UserAdsQueryFilters, AdResult>
  implements OnInit {

  private kind: AdKind;
  private param: string;
  shortName: string;
  self: boolean;

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService,
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['keywords', 'user', 'orderBy', 'statuses', 'productNumber'];
  }

  getInitialResultType() {
    return ResultType.TILES;
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.paramMap.get('user') || this.ApiHelper.SELF;
    this.kind = this.route.snapshot.paramMap.get('kind') as AdKind;
    this.allowedResultTypes = [ResultType.TILES, ResultType.LIST];
    this.addSub(this.marketplaceService.getUserAdsDataForSearch({ user: this.param, kind: this.kind }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: UserAdsDataForSearch) {
    super.onDataInitialized(data);
    this.self = this.authHelper.isSelfOrOwner(data.user);
    if (data.createNew) {
      this.headingActions = [
        new HeadingAction(SvgIcon.PlusCircle, this.i18n.general.addNew, () =>
          this.router.navigate(['/marketplace', this.param, this.kind, 'ad', 'new']), true),
      ];
    }
  }

  protected toSearchParams(value: any): UserAdsSearchParams {
    const params: UserAdsSearchParams = value;
    params.user = this.param;
    params.kind = this.kind;
    return params;
  }

  resolveHeading(mobile: boolean): string {
    if (this.self) {
      // Self title
      if (this.simple) {
        return mobile ? this.i18n.ad.mobileTitle.myAdvertisements : this.i18n.ad.title.myAdvertisements;
      } else {
        return mobile ? this.i18n.ad.mobileTitle.myWebshop : this.i18n.ad.title.myWebshop;
      }
    }
    // Management title
    if (this.simple) {
      return mobile ? this.i18n.ad.mobileTitle.viewAdvertisements : this.i18n.ad.title.viewAdvertisements;
    } else {
      return mobile ? this.i18n.ad.mobileTitle.viewWebshop : this.i18n.ad.title.viewWebshop;
    }

  }

  doSearch(filters: UserAdsSearchParams): Observable<HttpResponse<AdResult[]>> {
    return this.marketplaceService.searchUserAds$Response(filters);
  }

  resolveMenu() {
    if (this.param === this.ApiHelper.SELF) {
      return this.simple ? Menu.SEARCH_USER_ADS : Menu.SEARCH_USER_WEBSHOP;
    }
    return Menu.SEARCH_ADS;
  }

  /**
   * Returns if the ad is simple or webshop
   */
  get simple(): boolean {
    return this.kind === AdKind.SIMPLE;
  }

  get canViewPending(): boolean {
    const auth = this.dataForFrontendHolder.auth || {};
    const permissions = auth.permissions || {};
    const marketplace = permissions.marketplace || {};
    // Check authorization is active and is the owner or a manager with permission
    return this.data.requiresAuthorization && this.self
      || this.isManager && (this.simple ? marketplace.userSimple.viewPending : marketplace.userWebshop.viewPending);
  }

  get canViewDraft(): boolean {
    return this.data.requiresAuthorization && !this.isManager;
  }

  get isManager() {
    return !this.self &&
      (this.dataForFrontendHolder.role === RoleEnum.BROKER || this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR);
  }

}
