import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginService } from 'app/core/login.service';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { ConditionalMenu, Menu } from 'app/shared/menu';

const SearchMenu: ConditionalMenu = injector => {
  const login = injector.get(LoginService);
  if (login.user) {
    return Menu.SEARCH_USERS;
  } else {
    return Menu.PUBLIC_DIRECTORY;
  }
};

const marketplaceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchAdsComponent,
        data: {
          menu: SearchMenu
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
