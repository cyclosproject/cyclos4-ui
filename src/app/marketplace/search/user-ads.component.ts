import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdResult, UserAdsDataForSearch } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { words } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { MAX_SIZE_SHORT_NAME } from 'app/users/profile/view-profile.component';
import { cloneDeep } from 'lodash';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Lists the advertisements of a given user
 */
@Component({
  selector: 'user-ads',
  templateUrl: 'user-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAdsComponent
  extends BaseSearchPageComponent<UserAdsDataForSearch, AdResult>
  implements OnInit {

  private user: string;
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
    this.user = this.route.snapshot.paramMap.get('user');
    this.allowedResultTypes = [ResultType.TILES, ResultType.LIST];
    this.addSub(this.marketplaceService.getUserAdsDataForSearch({ user: this.user }).subscribe(data => this.data = data));
  }

  onDataInitialized(data: UserAdsDataForSearch) {
    super.onDataInitialized(data);
    this.shortName = words(data.user.display, MAX_SIZE_SHORT_NAME);
  }

  doSearch(value: any): Observable<HttpResponse<AdResult[]>> {
    const params = cloneDeep(value);
    params.user = this.user;
    return this.marketplaceService.searchUserAds$Response(params);
  }
}
