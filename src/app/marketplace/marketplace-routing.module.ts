import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';

const marketplaceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchAdsComponent
      },
      {
        path: ':user/list',
        component: UserAdsComponent
      },
      {
        path: 'view/:id',
        component: ViewAdComponent
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
