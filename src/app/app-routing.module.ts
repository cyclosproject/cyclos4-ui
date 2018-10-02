import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from 'app/login/login.component';
import { HomeComponent } from 'app/home/home.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { SharedModule } from 'app/shared/shared.module';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { Menu } from 'app/shared/menu';
import { ForgotPasswordComponent } from 'app/login/forgot-password.component';
import { ChangeForgottenPasswordComponent } from 'app/login/change-forgotten-password.component';
import { ChangeExpiredPasswordComponent } from 'app/login/change-expired-password.component';

const rootRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    data: {
      menu: Menu.HOME
    }
  },
  {
    path: 'home',
    component: HomeComponent,
    pathMatch: 'full',
    data: {
      menu: Menu.HOME
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
    path: 'expired-password',
    canActivate: [LoggedUserGuard],
    component: ChangeExpiredPasswordComponent,
    data: {
      menu: Menu.LOGIN
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
      onSameUrlNavigation: 'reload'
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
