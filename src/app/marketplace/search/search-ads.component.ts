import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdAddressResultEnum, AdCategoryWithChildren, AdResult, CustomFieldDetailed } from 'app/api/models';
import { AdDataForSearch } from 'app/api/models/ad-data-for-search';
import { MarketplaceService } from 'app/api/services';
import { FieldHelperService } from 'app/core/field-helper.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { MaxDistance } from 'app/shared/max-distance';

/**
 * Search for advertisements
 */
@Component({
  selector: 'search-ads',
  templateUrl: 'search-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAdsComponent
  extends BaseSearchPageComponent<AdDataForSearch, AdResult>
  implements OnInit {

  categoryTrail$ = new BehaviorSubject<AdCategoryWithChildren[]>(null);
  basicFields: CustomFieldDetailed[];
  advancedFields: CustomFieldDetailed[];

  constructor(
    injector: Injector,
    private fieldHelper: FieldHelperService,
    private marketplaceService: MarketplaceService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['keywords', 'groups', 'category', 'customValues', 'distanceFilter', 'orderBy'];
  }

  getInitialResultType() {
    return ResultType.CATEGORIES;
  }

  ngOnInit() {
    super.ngOnInit();
    this.allowedResultTypes = [ResultType.CATEGORIES, ResultType.TILES, ResultType.LIST, ResultType.MAP];
    this.stateManager.cache('data', this.marketplaceService.getAdDataForSearch({}))
      .subscribe(data => {
        const defaultQuery = data.query || {};
        this.form.patchValue(defaultQuery);
        if (defaultQuery.maxDistance || defaultQuery.latitude || defaultQuery.longitude) {
          // Here the distanceFilter is a MaxDistance, but the query has the distance properties directly
          this.form.get('distanceFilter').patchValue(defaultQuery);
        }
        this.data = data;
      });
  }

  onDataInitialized(data: AdDataForSearch) {
    const customField = (name: string) => data.customFields.find(f => f.internalName === name);
    this.basicFields = data.fieldsInBasicSearch.map(customField);
    this.advancedFields = data.fieldsInAdvancedSearch.map(customField);
    this.form.setControl('customValues', this.fieldHelper.customValuesFormGroup(data.customFields, {
      useDefaults: false
    }));
    this.headingActions = empty(this.advancedFields) || this.layout.xxs ? [] : [this.moreFiltersAction];
    super.onDataInitialized(data);
  }

  doSearch(value: any) {
    const params = cloneDeep(value);
    delete params['customValues'];
    params.customFields = this.fieldHelper.toCustomValuesFilter(value.customValues);
    params.addressResult = this.resultType === ResultType.MAP ? AdAddressResultEnum.ALL : AdAddressResultEnum.NONE;
    const distanceFilter: MaxDistance = value.distanceFilter;
    if (distanceFilter) {
      params.maxDistance = distanceFilter.maxDistance;
      params.latitude = distanceFilter.latitude;
      params.longitude = distanceFilter.longitude;
    }
    return this.marketplaceService.searchAds$Response(params);
  }

  onResultTypeChanged(resultType: ResultType, previousResultType: ResultType) {
    if (resultType === ResultType.CATEGORIES) {
      // Categories don't trigger updates, but reset the category filter
      this.form.patchValue({ category: null }, { emitEvent: false });
      this.categoryTrail$.next([]);
    } else {
      if (previousResultType === ResultType.CATEGORIES) {
        // Force a new query when changing from categories
        this.results = null;
      } else {
        const isMap = resultType === ResultType.MAP;
        const wasMap = previousResultType === ResultType.MAP;
        if (isMap !== wasMap) {
          // Should update again, as the `addressResult` will change
          this.results = null;
          this.update({ page: 0 });
        }
      }
    }
  }

  onCategorySelected(category: AdCategoryWithChildren) {
    const key = ApiHelper.internalNameOrId(category);
    const trail: AdCategoryWithChildren[] = [];
    if (key) {
      // A valid category is selected
      this.form.patchValue({ 'category': key });
      trail.unshift(category);
      const parent = this.findParent(category);
      if (parent) {
        trail.unshift(parent);
      }
      const root: AdCategoryWithChildren = {
        name: this.i18n.ad.rootCategory
      };
      trail.unshift(root);
    } else {
      // Going back to the main category
      this.form.patchValue({ 'category': key }, { emitEvent: false });
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
}
