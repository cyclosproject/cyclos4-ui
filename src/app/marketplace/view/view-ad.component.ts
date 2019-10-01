import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { AdCategoryWithParent, Address, AdView } from 'app/api/models';
import { MarketplaceService } from 'app/api/services';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { HeadingAction } from 'app/shared/action';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { words } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';


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
  id: string;
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
    this.id = this.route.snapshot.paramMap.get('id');
    this.addSub(this.marketplaceService.viewAd({ ad: this.id })
      .subscribe(ad => {
        this.data = ad;
      }));
  }

  /**
   * Removes this advertisement and goes back to the list page
   */
  protected doRemove() {
    this.addSub(this.marketplaceService.deleteAd({ ad: this.id }).subscribe(() => {
      this.notification.snackBar(this.i18n.general.removeDone(this.ad.name));
      history.back();
    }));
  }

  onDataInitialized(ad: AdView) {
    const headingActions: HeadingAction[] = [];
    if (ad.canEdit) {
      headingActions.push(
        new HeadingAction('edit', this.i18n.general.edit, () => {
          this.router.navigate(['/marketplace', 'edit', this.id]);
        }, true));
    }
    if (ad.canRemove) {
      headingActions.push(
        new HeadingAction('clear', this.i18n.general.remove, () => {
          this.notification.confirm({
            message: this.i18n.general.removeConfirm(this.ad.name),
            callback: () => this.doRemove()
          });
        }, true));
    }
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

  resolveMenu() {
    return Menu.SEARCH_ADS;
  }
}
