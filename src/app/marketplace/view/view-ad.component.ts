import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdCategoryWithParent, AdView } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';


/**
 * Displays an advertisement details
 */
@Component({
  selector: 'view-ad',
  templateUrl: 'view-ad.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewAdComponent extends BasePageComponent<AdView> implements OnInit {

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService) {
    super(injector);
  }

  get ad(): AdView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    const id = this.route.snapshot.paramMap.get('id');
    this.marketplaceService.viewAd({ ad: id })
      .subscribe(ad => {
        this.data = ad;
      });
  }

  get categoryLabel(): string {
    return (this.ad.categories || []).length === 1 ? this.i18n('Category') : this.i18n('Categories');
  }

  categoryLevels(category: AdCategoryWithParent) {
    const categories: AdCategoryWithParent[] = [];
    while (category != null) {
      categories.unshift(category);
      category = category.parent;
    }
    return categories;
  }

}
