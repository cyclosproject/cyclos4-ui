import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Menu } from 'app/shared/menu';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';

const marketplaceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchAdsComponent,
        data: {
          menu: Menu.SEARCH_ADVERTISEMENTS
        }
      }
    ]
  }
];

/**
 * * Routes for the marketplace module
 */
@NgModule({
  imports: [
    RouterModule.forChild(marketplaceRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class MarketplaceRoutingModule {
}
