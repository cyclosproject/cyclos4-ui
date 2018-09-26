import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { MarketplaceRoutingModule } from 'app/marketplace/marketplace-routing.module';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { ShowSubCategoriesComponent } from 'app/marketplace/search/show-sub-categories.component';

/**
 * Marketplace module
 */
@NgModule({
  imports: [
    MarketplaceRoutingModule,
    SharedModule
  ],
  exports: [],
  declarations: [
    SearchAdsComponent,
    ViewAdComponent,
    ShowSubCategoriesComponent
  ],
  entryComponents: [
    ShowSubCategoriesComponent
  ]
})
export class MarketplaceModule {
}
