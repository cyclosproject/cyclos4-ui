import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginService } from 'app/core/login.service';
import { SearchAdsComponent } from 'app/marketplace/search/search-ads.component';
import { UserAdsComponent } from 'app/marketplace/search/user-ads.component';
import { ViewAdComponent } from 'app/marketplace/view/view-ad.component';
import { ConditionalMenu, Menu } from 'app/shared/menu';
import { AuthHelperService } from 'app/core/auth-helper.service';

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
        path: ':user/list',
        component: UserAdsComponent,
        data: {
          menu: AuthHelperService.menuByRole(Menu.SEARCH_USERS, false)
        }
      },
      {
        path: 'view/:id',
        component: ViewAdComponent,
        data: {
          menu: SearchMenu
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
