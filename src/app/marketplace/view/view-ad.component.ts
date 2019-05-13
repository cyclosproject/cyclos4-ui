import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdCategoryWithParent, Address, AdView } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { words } from 'app/shared/helper';


/**
 * Displays an advertisement details
 */
@Component({
  selector: 'view-ad',
  templateUrl: 'view-ad.component.html',
  styleUrls: ['../../users/profile/view-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewAdComponent extends BaseViewPageComponent<AdView> implements OnInit {

  title: string;
  addresses: Address[];

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
    this.title = words(ad.name, 60);
    this.addresses = [...ad.adAddresses, ...ad.userAddresses];
  }

  get categoryLabel(): string {
    return (this.ad.categories || []).length === 1 ?
      this.i18n.ad.category : this.i18n.ad.categories;
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
