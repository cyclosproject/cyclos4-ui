import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdResult, AdDataForSearch } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { ResultType } from 'app/shared/result-type';
import { cloneDeep } from 'lodash';

/**
 * Lists the advertisements of a given user
 */
@Component({
  selector: 'user-ads',
  templateUrl: 'user-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAdsComponent
  extends BaseSearchPageComponent<AdDataForSearch, AdResult>
  implements OnInit {

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
    this.allowedResultTypes = [ResultType.TILES, ResultType.LIST];
    this.marketplaceService.getAdDataForSearch({}).subscribe(data => this.data = data);
  }

  doSearch(value) {
    const params = cloneDeep(value) as MarketplaceService.SearchUserAdsParams;
    params.user = this.route.snapshot.paramMap.get('user');
    return this.marketplaceService.searchUserAdsResponse(params);
  }
}
