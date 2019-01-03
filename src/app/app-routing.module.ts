import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router, PreloadAllModules } from '@angular/router';
import { ContentPageComponent } from 'app/content/content-page.component';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { HomeComponent } from 'app/home/home.component';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { AcceptPendingAgreementsComponent } from 'app/login/accept-pending-agreements.component';
import { ChangeExpiredPasswordComponent } from 'app/login/change-expired-password.component';
import { ChangeForgottenPasswordComponent } from 'app/login/change-forgotten-password.component';
import { ForgotPasswordComponent } from 'app/login/forgot-password.component';
import { LoginComponent } from 'app/login/login.component';
import { ConditionalMenu, Menu, RootMenu } from 'app/shared/menu';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { SharedModule } from 'app/shared/shared.module';
import { map } from 'rxjs/operators';

/**
 * A conditional menu resolver for the home page - either DASHBOARD or HOME
 */
const HomeMenu: ConditionalMenu = injector => {
  const login = injector.get(LoginService);
  return login.user ? Menu.DASHBOARD : Menu.HOME;
};

/**
 * A conditional menu resolver for content, which finds the content page by slug to resolve the correct menu
 */
const ContentMenu: ConditionalMenu = injector => {
  const url = injector.get(Router).url;
  const result = /page\/([^\/\?\#]+)/.exec(url);
  if (result == null) {
    return Menu.CONTENT_PAGE_CONTENT;
  }
  const slug = result[1];
  return injector.get(MenuService).contentPages$.pipe(
    map(contentPages => (contentPages || []).find(p => p.slug === slug)),
    map(page => {
      const rootMenu = page == null ? RootMenu.CONTENT : page.rootMenu;
      switch (rootMenu) {
        case RootMenu.BANKING:
          return Menu.CONTENT_PAGE_BANKING;
        case RootMenu.MARKETPLACE:
          return Menu.CONTENT_PAGE_MARKETPLACE;
        case RootMenu.PERSONAL:
          return Menu.CONTENT_PAGE_PERSONAL;
        default:
          return Menu.CONTENT_PAGE_CONTENT;
      }
    })
  );
};

const rootRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    data: {
      menu: HomeMenu
    }
  },
  {
    path: 'home',
    component: HomeComponent,
    pathMatch: 'full',
    data: {
      menu: HomeMenu
    }
  },
  {
    path: 'login',
    component: LoginComponent,
    data: {
      menu: Menu.LOGIN
    }
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: {
      menu: Menu.LOGIN
    }
  },
  {
    path: 'forgot-password/:key',
    component: ChangeForgottenPasswordComponent,
    data: {
      menu: Menu.LOGIN
    }
  },
  {
    path: 'pending-agreements',
    canActivate: [LoggedUserGuard],
    component: AcceptPendingAgreementsComponent,
    data: {
      menu: Menu.LOGIN
    }
  },
  {
    path: 'expired-password',
    canActivate: [LoggedUserGuard],
    component: ChangeExpiredPasswordComponent,
    data: {
      menu: Menu.LOGIN
    }
  },
  {
    path: 'page/:slug',
    component: ContentPageComponent,
    data: {
      menu: ContentMenu
    }
  },
  {
    path: 'banking',
    loadChildren: 'app/banking/banking.module#BankingModule'
  },
  {
    path: 'users',
    loadChildren: 'app/users/users.module#UsersModule'
  },
  {
    path: 'marketplace',
    loadChildren: 'app/marketplace/marketplace.module#MarketplaceModule'
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

/**
 * Module that defines the application routing
 */
@NgModule({
  imports: [
    RouterModule.forRoot(rootRoutes, {
      onSameUrlNavigation: 'reload',
      preloadingStrategy: PreloadAllModules
    }),
    SharedModule
  ],
  exports: [
    RouterModule
  ],
  providers: [
    LoggedUserGuard
  ]
})
export class AppRoutingModule { }
