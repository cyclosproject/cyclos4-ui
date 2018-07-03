import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import { MarketplaceService } from 'app/api/services';
import { AdResult, AdAddressResultEnum, AdCategoryWithChildren } from 'app/api/models';
import { ResultType } from 'app/shared/result-type';
import { AdDataForSearch } from 'app/api/models/ad-data-for-search';
import { AdsResultsComponent } from 'app/marketplace/search/ads-results.component';

/**
 * Search for advertisements
 */
@Component({
  selector: 'search-ads',
  templateUrl: 'search-ads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchAdsComponent extends BaseComponent {

  // Export enum to the template
  ResultType = ResultType;

  data: AdDataForSearch;

  renderingResults = new BehaviorSubject(true);

  resultTypes = [ResultType.CATEGORIES, ResultType.TILES, ResultType.LIST, ResultType.MAP];

  form: FormGroup;
  resultType: FormControl;

  query: any;
  dataSource = new TableDataSource<AdResult>(null);
  loaded = new BehaviorSubject(false);

  previousResultType: ResultType = ResultType.CATEGORIES;
  showFiltersVisible = new BehaviorSubject(false);

  @ViewChild('results') results: AdsResultsComponent;

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService,
    formBuilder: FormBuilder
  ) {
    super(injector);
    this.form = formBuilder.group({
      keywords: null,
      customValues: null
    });
    this.resultType = formBuilder.control(this.previousResultType);
    this.resultType.valueChanges.subscribe(rt => this.updateResultType(rt));

    this.stateManager.manage(this.form);
    this.subscriptions.push(this.form.valueChanges.pipe(
      debounceTime(ApiHelper.DEBOUNCE_TIME)
    ).subscribe(value => {
      this.update(value);
    }));
  }

  ngOnInit() {
    super.ngOnInit();

    // Get the data for advertisements search
    this.stateManager.cache('data', this.marketplaceService.getAdDataForSearch({}))
      .subscribe(data => {
        this.data = data;
        this.loaded.next(true);

        // Initialize the query
        this.query = this.stateManager.get('query', () => {
          return data.query;
        });
        this.query.user = ApiHelper.SELF;

        // Perform the search
        this.updateResultType(this.previousResultType, true);
      });
  }

  selectCategory(category: AdCategoryWithChildren) {
    this.query.category = ApiHelper.internalNameOrId(category);
    this.resultType.setValue(ResultType.TILES);
    this.update();
  }

  update(value?: any) {
    if (value == null) {
      value = this.form.value;
    }
    if (value) {
      // Update the query from the current form value
      this.query.keywords = value.keywords;
    }

    // Update the results
    const results = this.marketplaceService.searchAdsResponse(this.query).pipe(
      tap(response => {
        this.layout.fullHeightContent.next(response.body.length > 0 && this.resultType.value === ResultType.MAP);
        // When no rows state that results are not being rendered
        if (response.body.length === 0) {
          this.renderingResults.next(false);
        }
      })
    );
    this.dataSource.subscribe(results);
  }

  private updateResultType(resultType: ResultType, force = false) {
    const isCategories = resultType === ResultType.CATEGORIES;
    this.showFiltersVisible.next(!isCategories);
    if (isCategories) {
      // When showing categories, we do no ads search
      this.query.category = null;
      this.dataSource.next([]);
      this.renderingResults.next(false);
    } else {
      const isResults = resultType === ResultType.TILES || resultType === ResultType.LIST;
      const isMap = resultType === ResultType.MAP;
      const wasResults = this.previousResultType === ResultType.TILES || this.previousResultType === ResultType.LIST;
      if (force || isResults !== wasResults || isMap) {
        if (this.query) {
          this.query.page = 0;
          this.query.pageSize = null;
        }
        this.renderingResults.next(true);
        this.dataSource.next(null);
        this.query.addressResult = isMap ? AdAddressResultEnum.ALL : AdAddressResultEnum.NONE;
        this.update();
      }
    }
    this.previousResultType = resultType;
  }
}
