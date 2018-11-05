import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdAddressResultEnum, AdCategoryWithChildren, AdResult, CustomFieldDetailed } from 'app/api/models';
import { AdDataForSearch } from 'app/api/models/ad-data-for-search';
import { MarketplaceService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';

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
    private marketplaceService: MarketplaceService
  ) {
    super(injector);
    this.form.patchValue({ addressResult: AdAddressResultEnum.NONE }, { emitEvent: false });
  }

  protected getFormControlNames() {
    return ['keywords', 'category', 'addressResult', 'customValues', 'orderBy'];
  }

  getInitialResultType() {
    return ResultType.CATEGORIES;
  }

  ngOnInit() {
    super.ngOnInit();
    this.allowedResultTypes = [ResultType.CATEGORIES, ResultType.TILES, ResultType.LIST, ResultType.MAP];
    this.stateManager.cache('data', this.marketplaceService.getAdDataForSearch({}))
      .subscribe(data => this.data = data);
  }

  onDataInitialized(data: AdDataForSearch) {
    const customField = name => data.customFields.find(f => f.internalName === name);
    this.basicFields = data.fieldsInBasicSearch.map(customField);
    this.advancedFields = data.fieldsInAdvancedSearch.map(customField);
    this.form.setControl('customValues', ApiHelper.customValuesFormGroup(this.formBuilder, data.customFields));
    this.headingActions = empty(this.advancedFields) ? [] : [this.moreFiltersAction];
    super.onDataInitialized(data);
  }

  doSearch(value) {
    const params = cloneDeep(value) as MarketplaceService.SearchAdsParams;
    delete params['customValues'];
    params.customFields = ApiHelper.toCustomValuesFilter(value.customValues);
    return this.marketplaceService.searchAdsResponse(params);
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
      }
      const isMap = resultType === ResultType.MAP;
      const addressResult = isMap ? AdAddressResultEnum.ALL : AdAddressResultEnum.NONE;
      if (this.form.value.addressResult !== addressResult) {
        // Should change the address result
        this.results = null;
        this.resetPage();
        this.form.patchValue({ addressResult: addressResult }, { emitEvent: false });
      }
    }
  }

  onCategorySelected(category: AdCategoryWithChildren) {
    this.form.patchValue({ 'category': ApiHelper.internalNameOrId(category) });
  }
}
