import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdResult, UserAdsDataForSearch, UserAdsQueryFilters, AdKind, RoleEnum } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { words } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { MAX_SIZE_SHORT_NAME } from 'app/users/profile/view-profile.component';
import { Observable } from 'rxjs';
import { Menu } from 'app/shared/menu';
import { HeadingAction } from 'app/shared/action';

type UserAdsSearchParams = UserAdsQueryFilters & { user: string };

/**
 * Lists the advertisements of a given user
 */
@Component({
  selector: 'user-ads',
  templateUrl: 'user-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAdsComponent
  extends BaseSearchPageComponent<UserAdsDataForSearch, UserAdsQueryFilters, AdResult>
  implements OnInit {

  private kind: AdKind;
  private param: string;
  shortName: string;

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService
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
    this.shortName = words(data.user.display, MAX_SIZE_SHORT_NAME);
    if (data.createNew) {
      this.headingActions = [
        new HeadingAction('add', this.i18n.general.addNew, () => this.router.navigate(['/marketplace', this.param, this.kind, 'new']), true)
      ];
    }
  }

  protected toSearchParams(value: any): UserAdsSearchParams {
    const params: UserAdsSearchParams = value;
    params.user = this.param;
    params.kind = this.kind;
    return params;
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
    // TODO missing USER_PENDING_ADS_VIEW permission
    return this.data.requiresAuthorization && this.isManager;
  }

  get canViewDraft(): boolean {
    return this.data.requiresAuthorization && !this.isManager;
  }

  get isManager() {
    return !this.authHelper.isSelfOrOwner(this.data.user) &&
      (this.dataForUiHolder.role === RoleEnum.BROKER || this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR);
  }

}
