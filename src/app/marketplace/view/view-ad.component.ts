import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdCategoryWithParent, AdView } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { HeadingAction } from 'app/shared/action';
import { OperationHelperService } from 'app/core/operation-helper.service';


/**
 * Displays an advertisement details
 */
@Component({
  selector: 'view-ad',
  templateUrl: 'view-ad.component.html',
  styleUrls: ['../../users/profile/view-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewAdComponent extends BasePageComponent<AdView> implements OnInit {

  constructor(
    injector: Injector,
    private operationHelper: OperationHelperService,
    private marketplaceService: MarketplaceService) {
    super(injector);
  }

  get ad(): AdView {
    return this.data;
  }

  ngOnInit() {
    super.ngOnInit();
    this.headingActions = [this.printAction];
    const id = this.route.snapshot.paramMap.get('id');
    this.marketplaceService.viewAd({ ad: id })
      .subscribe(ad => {
        this.data = ad;
      });
  }

  onDataInitialized(ad: AdView) {
    const headingActions: HeadingAction[] = [];
    headingActions.push(this.printAction);
    for (const operation of ad.operations || []) {
      headingActions.push(this.operationHelper.headingAction(operation, ad.id));
    }
    this.headingActions = headingActions;
  }

  get categoryLabel(): string {
    return (this.ad.categories || []).length === 1 ?
      this.messages.ad.category : this.messages.ad.categories;
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
