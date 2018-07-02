import { Component, ChangeDetectionStrategy, Injector, ViewChild } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { TableDataSource } from 'app/shared/table-datasource';
import { ApiHelper } from 'app/shared/api-helper';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { tap } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import { MarketplaceService } from 'app/api/services';
import { AdResult, AdAddressResultEnum } from 'app/api/models';
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

  resultTypes = [ResultType.TILES, ResultType.LIST, ResultType.MAP];

  form: FormGroup;
  resultType: FormControl;

  query: any;
  dataSource = new TableDataSource<AdResult>(null);
  loaded = new BehaviorSubject(false);

  previousResultType: ResultType = ResultType.TILES;

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
    this.form.setControl('resultType', this.resultType);

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
    this.renderingResults.next(true);
    this.dataSource.next(null);
    const isMap = resultType === ResultType.MAP;
    const wasMap = this.previousResultType === ResultType.MAP;
    if (isMap !== wasMap || force) {
      if (this.query) {
        // When changing between map / no-map, reset the page
        this.query.page = 0;
        this.query.pageSize = null;
      }
      this.query.addressResult = isMap ? AdAddressResultEnum.ALL : AdAddressResultEnum.NONE;
      this.update();
    }
    this.previousResultType = resultType;
  }
}
