import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { ContentPageGuard } from 'app/ui/content-page-guard';
import { ContentPageComponent } from 'app/ui/content/content-page.component';
import { HomeComponent } from 'app/ui/home/home.component';
import { RedirectToLandingPageComponent } from 'app/ui/home/redirect-to-landing-page-component';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';
import { AcceptPendingAgreementsComponent } from 'app/ui/login/accept-pending-agreements.component';
import { ChangeExpiredPasswordComponent } from 'app/ui/login/change-expired-password.component';
import { ChangeForgottenPasswordComponent } from 'app/ui/login/change-forgotten-password.component';
import { ForgotPasswordComponent } from 'app/ui/login/forgot-password.component';
import { LoginConfirmationComponent } from 'app/ui/login/login-confirmation.component';
import { LoginComponent } from 'app/ui/login/login.component';
import { RedirectToLocationComponent } from 'app/ui/redirect-to-location-component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

const rootRoutes: Routes = [
  {
    path: '',
    component: RedirectToLandingPageComponent,
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'login-confirmation',
    component: LoginConfirmationComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'forgot-password/:key',
    component: ChangeForgottenPasswordComponent,
  },
  {
    path: 'pending-agreements',
    canActivate: [LoggedUserGuard],
    component: AcceptPendingAgreementsComponent,
  },
  {
    path: 'expired-password',
    canActivate: [LoggedUserGuard],
    component: ChangeExpiredPasswordComponent,
  },
  // {
  //   path: 'login-confirmation',
  //   canActivate: [LoggedUserGuard],
  //   component: LoginConfirmationComponent,
  // },
  {
    path: 'page/:slug',
    component: ContentPageComponent,
    canActivate: [ContentPageGuard],
  },
  {
    path: 'redirect/:location',
    component: RedirectToLocationComponent,
  },
  {
    path: 'banking',
    loadChildren: () => import('app/ui/banking/banking.module').then(m => m.BankingModule),
  },
  {
    path: 'users',
    loadChildren: () => import('app/ui/users/users.module').then(m => m.UsersModule),
  },
  {
    path: 'records',
    loadChildren: () => import('app/ui/records/records.module').then(m => m.RecordsModule),
  },
  {
    path: 'marketplace',
    loadChildren: () => import('app/ui/marketplace/marketplace.module').then(m => m.MarketplaceModule),
  },
  {
    path: 'personal',
    loadChildren: () => import('app/ui/personal/personal.module').then(m => m.PersonalModule),
  },
  {
    path: 'operations',
    loadChildren: () => import('app/ui/operations/operations.module').then(m => m.OperationsModule),
  },
  {
    path: 'wizards',
    loadChildren: () => import('app/ui/wizards/wizards.module').then(m => m.WizardsModule),
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];

/**
 * Module that defines the application routing
 */
@NgModule({
  imports: [
    RouterModule.forRoot(rootRoutes, {
      onSameUrlNavigation: 'reload',
      preloadingStrategy: PreloadAllModules,
    }),
    UiSharedModule,
  ],
  exports: [
    RouterModule,
  ],
  providers: [
    LoggedUserGuard,
    ContentPageGuard,
  ],
})
export class UiRoutingModule { }
