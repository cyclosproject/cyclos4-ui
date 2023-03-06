import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Ad, AdResult, Currency, UserAdsQueryFilters, UserFavoriteAdsListData } from 'app/api/models';
import { MarketplaceService } from 'app/api/services/marketplace.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { Observable } from 'rxjs';

/**
 * List of advertisement favorites
 */

type UserAdsSearchParams = UserAdsQueryFilters & { user: string; };
@Component({
  selector: 'list-favorites',
  templateUrl: 'list-favorites.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ListFavoritesComponent
  extends BaseSearchPageComponent<UserFavoriteAdsListData, UserAdsQueryFilters, AdResult>
  implements OnInit {

  getFormControlNames(): string[] {
    return [];
  }

  doSearch(filters: UserAdsSearchParams): Observable<HttpResponse<AdResult[]>> {
    return this.marketplaceService.searchUserAds$Response(filters);
  }

  toSearchParams(value: any): UserAdsQueryFilters {
    const params: UserAdsSearchParams = value;
    params.favoriteFor = this.data.user.id;
    return params;
  }

  self: boolean;
  param: string;

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.params.user || this.ApiHelper.SELF;
    this.addSub(this.marketplaceService.getUserFavoriteAdsListData({ user: this.param }).subscribe(data =>
      this.data = data
    ));
  }

  onDataInitialized(data: UserFavoriteAdsListData) {
    super.onDataInitialized(data);
    this.self = this.authHelper.isSelfOrOwner(data.user);
  }

  viewPath(ad: Ad) {
    return ['/marketplace', 'view', ad.id];
  }

  get toLink() {
    return (ad: Ad) => this.viewPath(ad);
  }

  remove(ad: Ad) {
    this.confirmation.confirm({
      message: this.i18n.general.removeItemConfirm,
      callback: () => this.doRemove(ad),
    });
  }

  private doRemove(ad: Ad) {
    this.addSub(this.marketplaceService.unmarkAsFavorite({ ad: ad.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeItemDone);
      this.reload();
    }));
  }

  resolveMenu(data: UserFavoriteAdsListData) {
    return this.menu.userMenu(data.user, Menu.FAVORITE_ADS);
  }

  /**
   * Returns the currency for the given ad
   * @param ad The advertisement
   */
  lookupCurrency(ad: AdResult): Currency {
    const currencies = this.data.currencies;
    return currencies.find(c => c.internalName === ad.currency || c.id === ad.currency);
  }

  /**
 * Returns the number of decimals for the given ad's price
 * @param ad The advertisement
 */
  decimals(ad: AdResult): number {
    return (this.lookupCurrency(ad) || {}).decimalDigits || 0;
  }
}
