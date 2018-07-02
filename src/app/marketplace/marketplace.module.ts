import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { MarketplaceRoutingModule } from 'app/marketplace/marketplace-routing.module';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { AdsResultsComponent } from 'app/marketplace/search/ads-results.component';

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
    AdsResultsComponent
  ],
  entryComponents: [
  ]
})
export class MarketplaceModule {
}
