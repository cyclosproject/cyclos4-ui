import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  AdAddressResultEnum,
  AdCategoryWithChildren,
  AdInitialSearchTypeEnum,
  AdQueryFilters,
  AdResult,
  Currency,
  CustomFieldDetailed,
  MarketplacePermissions,
  RoleEnum
} from 'app/api/models';
import { AdDataForSearch } from 'app/api/models/ad-data-for-search';
import { MarketplaceService } from 'app/api/services/marketplace.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { empty } from 'app/shared/helper';
import { PagedResults } from 'app/shared/paged-results';
import { LoginService } from 'app/ui/core/login.service';
import { MapsService } from 'app/ui/core/maps.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { MaxDistance } from 'app/ui/shared/max-distance';
import { Menu } from 'app/ui/shared/menu';
import { ResultType } from 'app/ui/shared/result-type';
import { BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Search for advertisements
 */
@Component({
  selector: 'search-ads',
  templateUrl: 'search-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAdsComponent
  extends BaseSearchPageComponent<AdDataForSearch, AdQueryFilters, AdResult>
  implements OnInit
{
  brokered: boolean;
  categoryTrail$ = new BehaviorSubject<AdCategoryWithChildren[]>([]);
  currency$ = new BehaviorSubject<Currency>(null);
  profileFields: (string | CustomFieldDetailed)[];
  basicFields: CustomFieldDetailed[];
  advancedFields: CustomFieldDetailed[];
  marketplacePermissions: MarketplacePermissions;

  adsAction: HeadingAction;
  categoriesAction: HeadingAction;

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService,
    private loginService: LoginService,
    private mapService: MapsService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return [
      'keywords',
      'statuses',
      'groups',
      'category',
      'customValues',
      'distanceFilter',
      'orderBy',
      'kind',
      'hasImages',
      'minAmount',
      'maxAmount',
      'currency',
      'beginDate',
      'endDate',
      'favoriteFor'
    ];
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
    this.brokered = this.route.snapshot.data.brokered;
    const types = [ResultType.TILES, ResultType.LIST];
    if (this.mapService.enabled) {
      types.push(ResultType.MAP);
    }
    this.allowedResultTypes = types;
    this.stateManager
      .cache('data', this.marketplaceService.getAdDataForSearch({ brokered: this.brokered }))
      .subscribe(data => (this.data = data));
  }

  prepareForm(data: AdDataForSearch) {
    this.form.setControl(
      'customValues',
      this.fieldHelper.customFieldsForSearchFormGroup(data.customFields, data.query.customFields)
    );
    this.form.setControl(
      'profileFields',
      this.fieldHelper.profileFieldsForSearchFormGroup(data.basicProfileFields, data.customProfileFields)
    );
  }

  onDataInitialized(data: AdDataForSearch) {
    this.marketplacePermissions = ((this.dataForFrontendHolder.auth || {}).permissions || {}).marketplace || {};

    const customField = (name: string) => data.customFields.find(f => f.internalName === name);
    this.basicFields = data.fieldsInBasicSearch.map(customField);
    this.advancedFields = data.fieldsInAdvancedSearch.map(customField);

    this.headingActions = [this.moreFiltersAction];

    this.adsAction = new HeadingAction(
      SvgIcon.Handbag,
      this.i18n.ad.listAds,
      () => (this.resultType = this.getResultType(data.resultType))
    );
    this.categoriesAction = new HeadingAction(
      SvgIcon.Book,
      this.i18n.ad.showCategories,
      () => (this.resultType = ResultType.CATEGORIES)
    );

    this.addSub(this.form.get('currency').valueChanges.subscribe(id => this.updateCurrency(id, data)));
    // Preselect the currency if there is a single one
    if (!empty(data.currencies) && data.currencies.length === 1) {
      this.currency = data.currencies[0];
    }

    const latestAds = this.route.snapshot.queryParams.latest;
    if (latestAds) {
      // Ads are already ordered by publish date as default
      this.resultType = this.allowedResultTypes.find(rt => rt !== ResultType.CATEGORIES);
    } else if (data.adInitialSearchType === AdInitialSearchTypeEnum.CATEGORIES) {
      this.resultType = ResultType.CATEGORIES;
    } else {
      this.resultType = this.getResultType(data.resultType);
    }

    this.categoryTrail$.next(this.stateManager.get('categoryTrail'));
    super.onDataInitialized(data);

    this.addSub(
      this.form.valueChanges
        .pipe(distinctUntilChanged(), debounceTime(ApiHelper.DEBOUNCE_TIME))
        .subscribe(() => (this.resultType = this.getResultType(data.resultType)))
    );
  }

  listAds() {
    if (this.resultType === ResultType.CATEGORIES) {
      // Switch on: show ads in the default type
      this.resultType = this.getDefaultResultType();
    } else {
      // Switch off: show categories
      this.resultType = ResultType.CATEGORIES;
    }
  }

  doSearch(value: AdQueryFilters) {
    return this.marketplaceService.searchAds$Response(value);
  }

  protected toSearchParams(value: any): AdQueryFilters {
    const params: AdQueryFilters = { ...value };
    const isMap = this.resultType === ResultType.MAP;
    params.customFields = this.fieldHelper.toCustomValuesFilter(value.customValues);
    params.profileFields = this.fieldHelper.toProfileFieldsFilter(value.profileFields);
    params.addressResult = isMap ? AdAddressResultEnum.ALL : AdAddressResultEnum.NONE;
    if (this.brokered) {
      params.brokers = [this.login.user.id];
    }
    const distanceFilter: MaxDistance = value.distanceFilter;
    if (distanceFilter) {
      params.maxDistance = distanceFilter.maxDistance;
      params.latitude = distanceFilter.latitude;
      params.longitude = distanceFilter.longitude;
      params.addressResult = AdAddressResultEnum.NEAREST;
    }
    params.favoriteFor = value.favoriteFor ? ApiHelper.SELF : null;
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

  get root(): AdCategoryWithChildren {
    const root: AdCategoryWithChildren = {
      name: this.i18n.ad.rootCategory
    };
    return root;
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
      trail.unshift(this.root);
    } else {
      // Going back to the main category
      this.form.patchValue({ category: key }, { emitEvent: false });
      this.resultType = ResultType.CATEGORIES;
    }
    this.categoryTrail$.next(trail);
    this.stateManager.set('categoryTrail', this.categoryTrail$.value);
  }

  protected onBeforeRender(_results: PagedResults<AdResult>) {
    if (_results && _results.hasResults && this.categoryTrail$.value?.length === 0) {
      this.categoryTrail$.next([this.root]);
    }
  }

  getDefaultResultType(): ResultType {
    return this.getResultType(this.data.resultType);
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
    return this.dataForFrontendHolder.role === RoleEnum.ADMINISTRATOR || this.isBrokeredSearch;
  }

  get isBrokeredSearch(): boolean {
    return this.dataForFrontendHolder.role === RoleEnum.BROKER && !empty(this.data.query.brokers);
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
