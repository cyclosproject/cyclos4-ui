import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdResult, UserAdsDataForSearch, UserAdsQueryFilters } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { words } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { MAX_SIZE_SHORT_NAME } from 'app/users/profile/view-profile.component';
import { Observable } from 'rxjs';
import { Menu } from 'app/shared/menu';

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

  private param: string;
  shortName: string;

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['keywords', 'user'];
  }

  getInitialResultType() {
    return ResultType.TILES;
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.paramMap.get('user');
    this.allowedResultTypes = [ResultType.TILES, ResultType.LIST];
    this.addSub(this.marketplaceService.getUserAdsDataForSearch({ user: this.param }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: UserAdsDataForSearch) {
    super.onDataInitialized(data);
    this.shortName = words(data.user.display, MAX_SIZE_SHORT_NAME);
  }

  protected toSearchParams(value: any): UserAdsSearchParams {
    const params: UserAdsSearchParams = value;
    params.user = this.param;
    return params;
  }

  doSearch(filters: UserAdsSearchParams): Observable<HttpResponse<AdResult[]>> {
    return this.marketplaceService.searchUserAds$Response(filters);
  }

  resolveMenu() {
    return Menu.SEARCH_ADS;
  }
}
