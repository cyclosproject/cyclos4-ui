import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ContentPageGuard } from 'app/content-page-guard';
import { ContentPageComponent } from 'app/content/content-page.component';
import { HomeComponent } from 'app/home/home.component';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { AcceptPendingAgreementsComponent } from 'app/login/accept-pending-agreements.component';
import { ChangeExpiredPasswordComponent } from 'app/login/change-expired-password.component';
import { ChangeForgottenPasswordComponent } from 'app/login/change-forgotten-password.component';
import { ForgotPasswordComponent } from 'app/login/forgot-password.component';
import { LoginComponent } from 'app/login/login.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { SharedModule } from 'app/shared/shared.module';

const rootRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'forgot-password/:key',
    component: ChangeForgottenPasswordComponent
  },
  {
    path: 'pending-agreements',
    canActivate: [LoggedUserGuard],
    component: AcceptPendingAgreementsComponent
  },
  {
    path: 'expired-password',
    canActivate: [LoggedUserGuard],
    component: ChangeExpiredPasswordComponent
  },
  {
    path: 'page/:slug',
    component: ContentPageComponent,
    canActivate: [ContentPageGuard]
  },
  {
    path: 'banking',
    loadChildren: () => import('app/banking/banking.module').then(m => m.BankingModule)
  },
  {
    path: 'users',
    loadChildren: () => import('app/users/users.module').then(m => m.UsersModule)
  },
  {
    path: 'records',
    loadChildren: () => import('app/records/records.module').then(m => m.RecordsModule)
  },
  {
    path: 'marketplace',
    loadChildren: () => import('app/marketplace/marketplace.module').then(m => m.MarketplaceModule)
  },
  {
    path: 'personal',
    loadChildren: () => import('app/personal/personal.module').then(m => m.PersonalModule)
  },
  {
    path: 'operations',
    loadChildren: () => import('app/operations/operations.module').then(m => m.OperationsModule)
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
    LoggedUserGuard,
    ContentPageGuard
  ]
})
export class AppRoutingModule { }
