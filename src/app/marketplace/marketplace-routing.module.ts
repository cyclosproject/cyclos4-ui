import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { EditAdComponent } from 'app/marketplace/edit-ad.component';
import { SearchOrdersComponent } from 'app/marketplace/search/search-orders.component';
import { ViewOrderComponent } from 'app/marketplace/view/view-order.component';

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
        path: ':user/purchases',
        component: SearchOrdersComponent
      },
      {
        path: ':user/sales',
        component: SearchOrdersComponent
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
      {
        path: 'order/:id',
        component: ViewOrderComponent
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
