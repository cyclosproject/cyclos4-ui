import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { EditAdComponent } from 'app/marketplace/edit-ad.component';

const marketplaceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchAdsComponent
      },
      {
        path: ':user/:kind/list',
        component: UserAdsComponent
      },
      {
        path: ':user/:kind/new',
        component: EditAdComponent
      },
      {
        path: 'view/:id',
        component: ViewAdComponent
      },
      {
        path: 'edit/:id',
        component: EditAdComponent
      },
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
