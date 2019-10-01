import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { MarketplaceRoutingModule } from 'app/marketplace/marketplace-routing.module';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { ShowSubCategoriesComponent } from 'app/marketplace/search/show-sub-categories.component';
import { AdsResultsComponent } from 'app/marketplace/search/ads-results.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { EditAdComponent } from 'app/marketplace/edit-ad.component';

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
    UserAdsComponent,
    AdsResultsComponent,
    EditAdComponent,
    ViewAdComponent,
    ShowSubCategoriesComponent
  ],
  entryComponents: [
    ShowSubCategoriesComponent
  ]
})
export class MarketplaceModule {
}
