import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AdAddressResultEnum, AdCategoryWithChildren, AdQueryFilters,
  AdResult, Currency, CustomFieldDetailed, MarketplacePermissions, RoleEnum,
} from 'app/api/models';
import { AdDataForSearch } from 'app/api/models/ad-data-for-search';
import { MarketplaceService } from 'app/api/services';
import { LoginService } from 'app/core/login.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { MaxDistance } from 'app/shared/max-distance';
import { Menu } from 'app/shared/menu';
import { ResultType } from 'app/shared/result-type';
import { BehaviorSubject } from 'rxjs';

/**
 * Search for advertisements
 */
@Component({
  selector: 'search-ads',
  templateUrl: 'search-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchAdsComponent
  extends BaseSearchPageComponent<AdDataForSearch, AdQueryFilters, AdResult>
  implements OnInit {

  categoryTrail$ = new BehaviorSubject<AdCategoryWithChildren[]>(null);
  currency$ = new BehaviorSubject<Currency>(null);
  basicFields: CustomFieldDetailed[];
  advancedFields: CustomFieldDetailed[];
  marketplacePermissions: MarketplacePermissions;

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService,
    private loginService: LoginService,
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['keywords', 'statuses', 'groups', 'category', 'customValues', 'distanceFilter', 'orderBy', 'kind', 'hasImages',
      'minAmount', 'maxAmount', 'currency', 'beginDate', 'endDate'];
  }

  getInitialResultType() {
    const fromConfig = this.layout.getBreakpointConfiguration('defaultAdsResultType') as ResultType;
    if (fromConfig && this.allowedResultTypes.includes(fromConfig)) {
      return fromConfig;
    }
    return (this.layout.xxs ? ResultType.LIST : ResultType.CATEGORIES);
  }

  getInitialFormValue(data: AdDataForSearch) {
    const value = super.getInitialFormValue(data);
    if (value.maxDistance || value.latitude || value.longitude) {
      // Here the distanceFilter is a MaxDistance, but the query has the distance properties directly
      value.distanceFilter = value;
    }
    return value;
  }

  ngOnInit() {
    super.ngOnInit();
    this.allowedResultTypes = this.layout.xxs
      ? [ResultType.CATEGORIES, ResultType.LIST]
      : [ResultType.CATEGORIES, ResultType.TILES, ResultType.LIST, ResultType.MAP];
    this.resultType = this.getInitialResultType();
    this.stateManager.cache('data', this.marketplaceService.getAdDataForSearch({}))
      .subscribe(data => {
        this.data = data;
      });
  }

  onDataInitialized(data: AdDataForSearch) {
    const auth = this.dataForUiHolder.auth || {};
    const permissions = auth.permissions || {};
    this.marketplacePermissions = permissions.marketplace || {};

    const customField = (name: string) => data.customFields.find(f => f.internalName === name);
    this.basicFields = data.fieldsInBasicSearch.map(customField);
    this.advancedFields = data.fieldsInAdvancedSearch.map(customField);
    this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(data.customFields, {
      useDefaults: false,
    }));
    this.headingActions = [this.moreFiltersAction];

    this.addSub(this.form.get('currency').valueChanges.subscribe(id =>
      this.updateCurrency(id, data)));
    // Preselect the currency if there is a single one
    if (!empty(data.currencies) && data.currencies.length === 1) {
      this.currency = data.currencies[0];
    }
    super.onDataInitialized(data);
  }

  doSearch(value: AdQueryFilters) {
    return this.marketplaceService.searchAds$Response(value);
  }

  protected toSearchParams(value: any): AdQueryFilters {
    const params: AdQueryFilters = value;
    const isMap = this.resultType === ResultType.MAP;
    params.customFields = this.fieldHelper.toCustomValuesFilter(value.customValues);
    params.addressResult = isMap ? AdAddressResultEnum.ALL : AdAddressResultEnum.NONE;
    const distanceFilter: MaxDistance = value.distanceFilter;
    if (distanceFilter) {
      params.maxDistance = distanceFilter.maxDistance;
      params.latitude = distanceFilter.latitude;
      params.longitude = distanceFilter.longitude;
      params.addressResult = AdAddressResultEnum.NEAREST;
    }
    params.publicationPeriod = ApiHelper.dateRangeFilter(value.beginDate, value.endDate);
    params.priceRange = ApiHelper.rangeFilter(value.minAmount, value.maxAmount);
    if (isMap) {
      params.pageSize = 99999;
    }
    return params;
  }

  onResultTypeChanged(resultType: ResultType, previousResultType: ResultType) {
    if (resultType === ResultType.CATEGORIES) {
      // Categories don't trigger updates, but reset the category filter
      this.form.patchValue({ category: null }, { emitEvent: false });
      this.categoryTrail$.next([]);
    } else {
      // Changing from / to map will implicitly update - just reset the page to 0
      const isMap = resultType === ResultType.MAP;
      const wasMap = previousResultType === ResultType.MAP;
      if (isMap !== wasMap) {
        this.form.patchValue({ page: 0 }, { emitEvent: false });
      }
    }
  }

  onCategorySelected(category: AdCategoryWithChildren) {
    const key = ApiHelper.internalNameOrId(category);
    const trail: AdCategoryWithChildren[] = [];
    if (key) {
      // A valid category is selected
      this.form.patchValue({ category: key });
      trail.unshift(category);
      const parent = this.findParent(category);
      if (parent) {
        trail.unshift(parent);
      }
      const root: AdCategoryWithChildren = {
        name: this.i18n.ad.rootCategory,
      };
      trail.unshift(root);
    } else {
      // Going back to the main category
      this.form.patchValue({ category: key }, { emitEvent: false });
      this.resultType = ResultType.CATEGORIES;
    }
    this.categoryTrail$.next(trail);
  }

  private findParent(category: AdCategoryWithChildren): AdCategoryWithChildren {
    for (const cat of this.data.categories) {
      if (cat.children.includes(category)) {
        return cat;
      }
    }
    return null;
  }

  resolveMenu() {
    return this.login.user ? Menu.SEARCH_ADS : Menu.PUBLIC_MARKETPLACE;
  }

  /**
   * Changes the current currency to update related filters
   */
  protected updateCurrency(id: string, data: AdDataForSearch) {
    this.currency = data.currencies.find(c => c.id === id || c.internalName === id);
  }

  /**
   * Returns if the current user is a manager to enable specific filters
   */
  get manager(): boolean {
    return this.dataForUiHolder.role === RoleEnum.ADMINISTRATOR ||
      (this.dataForUiHolder.role === RoleEnum.BROKER &&
        !empty(this.data.query.brokers));
  }

  /**
   * Returns if the current user can view pending ads/webshop
   */
  get canViewPending(): boolean {
    return this.marketplacePermissions.userSimple.viewPending || this.marketplacePermissions.userWebshop.viewPending;
  }

  /**
   * Returns currency, min and max price filters should be hidden
   */
  get hidePrice(): boolean {
    return this.data.hidePrice || this.loginService.user == null;
  }

  get currency(): Currency {
    return this.currency$.value;
  }

  set currency(currency: Currency) {
    this.currency$.next(currency);
  }

}
