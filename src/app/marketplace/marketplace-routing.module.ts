import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Menu } from 'app/shared/menu';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { BuyVoucherComponent } from 'app/banking/vouchers/buy-voucher.component';

const marketplaceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchAdsComponent,
        data: {
          menu: Menu.SEARCH_ADS
        }
      },
      {
        path: 'public-search',
        component: SearchAdsComponent,
        data: {
          menu: Menu.PUBLIC_MARKETPLACE
        }
      },
      {
        path: 'user/:user',
        component: UserAdsComponent,
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: 'view/:id',
        component: ViewAdComponent,
        data: {
          menu: Menu.SEARCH_ADS
        }
      },
      {
        path: 'buy-voucher',
        component: BuyVoucherComponent,
        data: {
          menu: Menu.BUY_VOUCHER
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
