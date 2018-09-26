import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdAddressResultEnum, AdCategoryWithChildren, AdResult, Currency, Image } from 'app/api/models';
import { AdDataForSearch } from 'app/api/models/ad-data-for-search';
import { MarketplaceService } from 'app/api/services';
import { ShowSubCategoriesComponent } from 'app/marketplace/search/show-sub-categories.component';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { ResultType } from 'app/shared/result-type';
import { environment } from 'environments/environment';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BehaviorSubject } from 'rxjs';

const MAX_CHILDREN = 5;

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

  // Export enum to the template
  ResultType = ResultType;
  empty = empty;

  allowedResultTypes = [ResultType.CATEGORIES, ResultType.TILES, ResultType.LIST, ResultType.MAP];
  categoryTrail$ = new BehaviorSubject<AdCategoryWithChildren[]>(null);

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService,
    private modal: BsModalService
  ) {
    super(injector);
    this.form.patchValue({ addressResult: AdAddressResultEnum.NONE }, { emitEvent: false });
  }

  protected getFormControlNames() {
    return ['keywords', 'category', 'addressResult', 'orderBy'];
  }

  getInitialResultType() {
    return ResultType.CATEGORIES;
  }

  ngOnInit() {
    super.ngOnInit();
    this.stateManager.cache('dataForMap', this.marketplaceService.getAdDataForSearch({}))
      .subscribe(data => this.data = data);
  }

  doSearch(value) {
    return this.marketplaceService.searchAdsResponse(value);
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
        this.form.patchValue({ addressResult: addressResult });
      }
    }
  }

  toAddress(ad: AdResult) {
    return ad.address;
  }

  toMarkerTitle(ad: AdResult) {
    return ad.name;
  }

  /**
   * Returns the display name of the given custom field
   * @param field The field identifier
   */
  fieldName(field: string): string {
    const customField = this.data.customFields.find(cf => cf.internalName === field);
    return (customField || {}).name;
  }

  /**
   * Returns the route components for the given ad
   */
  path(ad: AdResult): string[] {
    return ['/marketplace', 'view', ad.id];
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

  /**
   * Select a category and show results for that one
   */
  selectCategory(category: AdCategoryWithChildren) {
    if (category.id == null) {
      // Root category
      this.resultType = ResultType.CATEGORIES;
      this.categoryTrail$.next([]);
      return;
    }

    // This will trigger an update
    this.resultType = this.layout.xxs ? ResultType.LIST : ResultType.TILES;
    this.results = null;
    this.form.patchValue({ 'category': ApiHelper.internalNameOrId(category) });

    const trail: AdCategoryWithChildren[] = [];
    trail.unshift(category);
    const parent = this.findParent(category);
    if (parent) {
      trail.unshift(parent);
    }
    const root: AdCategoryWithChildren = {
      name: this.i18n('Root')
    };
    trail.unshift(root);
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

  /**
   * Returns the configured display color for the given category
   * @param cat The category
   */
  categoryColor(cat: AdCategoryWithChildren): string {
    const colors = environment.adCategoryColors || {};
    return colors[cat.internalName];
  }

  /**
   * Returns the configured icon for the given category
   * @param cat The category
   */
  categoryIcon(cat: AdCategoryWithChildren): string {
    const icons = environment.adCategoryIcons || {};
    return icons[cat.internalName] || 'category';
  }

  /**
   * Returns the category image, but only if it doesn't have a specific icon
   * @param cat The category
   */
  categoryImage(cat: AdCategoryWithChildren): Image {
    if (this.categoryIcon(cat)) {
      return null;
    }
    return cat.image;
  }

  /**
   * Return a maximum of `MAX_CHILDREN` child categories
   * @param cat The category
   */
  categoryChildren(cat: AdCategoryWithChildren): AdCategoryWithChildren[] {
    const children = cat.children || [];
    return children.length <= MAX_CHILDREN ? children : children.slice(0, MAX_CHILDREN);
  }

  /**
   * Returns whether the given category has more children than the maximum allowed
   * @param cat The category
   */
  hasMoreChildren(cat: AdCategoryWithChildren): boolean {
    const children = cat.children || [];
    return children.length > MAX_CHILDREN;
  }

  /**
   * Opens a dialog for the user to pick a child category
   * @param cat The category
   */
  showAllChildren(cat: AdCategoryWithChildren): void {
    const ref = this.modal.show(ShowSubCategoriesComponent, {
      class: 'modal-form modal-small',
      initialState: {
        category: cat,
        image: this.categoryImage(cat),
        icon: this.categoryIcon(cat),
        color: this.categoryColor(cat)
      }
    });
    const comp = ref.content as ShowSubCategoriesComponent;
    this.addSub(comp.select.subscribe(sub => {
      this.selectCategory(sub);
    }));
  }


}
