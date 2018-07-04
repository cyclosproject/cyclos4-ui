import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { BaseComponent } from 'app/shared/base.component';
import { MarketplaceService } from 'app/api/services';
import { AdView, Country, AdCategoryWithParent } from 'app/api/models';
import { ErrorStatus } from 'app/core/error-status';
import { HttpErrorResponse } from '@angular/common/http';
import { Action } from 'app/shared/action';

/**
 * Displays an advertisement details
 */
@Component({
  selector: 'view-ad',
  templateUrl: 'view-ad.component.html',
  styleUrls: ['view-ad.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewAdComponent extends BaseComponent {

  constructor(
    injector: Injector,
    private marketplaceService: MarketplaceService) {
    super(injector);
  }

  loaded = new BehaviorSubject(false);
  ad: AdView;
  countries: BehaviorSubject<Country[]>;
  titleActions = new BehaviorSubject<Action[]>(null);

  ngOnInit() {
    super.ngOnInit();
    const id = this.route.snapshot.paramMap.get('id');
    if (id == null) {
      this.notification.error(this.messages.errorPermission());
      this.loaded.next(true);
      return;
    } else {
      this.marketplaceService.viewAd({ ad: id })
        .subscribe(ad => {
          this.ad = ad;
          this.loaded.next(true);
        });
    }
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
