import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdResult, UserAdsDataForSearch } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { words } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { MAX_SIZE_SHORT_NAME } from 'app/users/profile/view-profile.component';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';

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
  title$ = new BehaviorSubject<string>(null);

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
    this.marketplaceService.getUserAdsDataForSearch({ user: this.user }).subscribe(data => this.data = data);
    this.addSub(this.layout.xxs$.subscribe(() => this.updateTitle()));
    this.updateTitle();
  }

  private updateTitle() {
    if (this.layout.xxs) {
      this.title$.next(this.i18n('Advertisements'));
    } else {
      this.title$.next(this.i18n('Advertisements of {{name}}', {
        name: this.shortName
      }));
    }
  }

  onDataInitialized(data: UserAdsDataForSearch) {
    super.onDataInitialized(data);
    this.shortName = words(data.user.display, MAX_SIZE_SHORT_NAME);
    this.updateTitle();
  }

  doSearch(value: any) {
    const params = cloneDeep(value) as MarketplaceService.SearchUserAdsParams;
    params.user = this.user;
    return this.marketplaceService.searchUserAdsResponse(params);
  }
}
