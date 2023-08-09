import { NgModule } from '@angular/core';
import { NoPreloading, RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { SharedModule } from 'app/shared/shared.module';
import { ContentPageComponent } from 'app/ui/content/content-page.component';
import { HelpComponent } from 'app/ui/core/help.component';
import { HomeComponent } from 'app/ui/core/home.component';
import { RedirectToLandingPageComponent } from 'app/ui/core/redirect-to-landing-page-component';
import { InviteTokenComponent } from 'app/ui/invite/invite-token.component';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';
import { LoginComponent } from 'app/ui/login/login.component';
import { RedirectToLocationComponent } from 'app/ui/redirect-to-location-component';

const rootRoutes: Routes = [
  {
    path: '',
    component: RedirectToLandingPageComponent,
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'help',
    component: HelpComponent,
  },
  {
    path: 'forgot-password',
    redirectTo: '/post-login/forgot-password'
  },
  {
    path: 'page/:slug',
    component: ContentPageComponent,
  },
  {
    path: 'redirect/:location',
    component: RedirectToLocationComponent,
  },
  {
    path: 'invite/:token',
    component: InviteTokenComponent,
  },
  {
    path: 'banking',
    loadChildren: () => import('app/ui/banking/banking.module').then(m => m.BankingModule),
  },
  {
    path: 'dashboard',
    loadChildren: () => import('app/ui/dashboard/dashboard.module').then(m => m.DashboardModule),
  },
  {
    // Rename to login-extras
    path: 'post-login',
    loadChildren: () => import('app/ui/login/post-login.module').then(m => m.PostLoginModule),
  },
  {
    path: 'marketplace',
    loadChildren: () => import('app/ui/marketplace/marketplace.module').then(m => m.MarketplaceModule),
  },
  {
    path: 'operations',
    loadChildren: () => import('app/ui/operations/operations.module').then(m => m.OperationsModule),
  },
  {
    path: 'personal',
    loadChildren: () => import('app/ui/personal/personal.module').then(m => m.PersonalModule),
  },
  {
    path: 'records',
    loadChildren: () => import('app/ui/records/records.module').then(m => m.RecordsModule),
  },
  {
    path: 'users',
    loadChildren: () => import('app/ui/users/users.module').then(m => m.UsersModule),
  },
  {
    path: 'wizards',
    loadChildren: () => import('app/ui/wizards/wizards.module').then(m => m.WizardsModule),
  },
  {
    path: 'imports',
    loadChildren: () => import('app/ui/imports/imports.module').then(m => m.ImportsModule),
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
      preloadingStrategy: NoPreloading,
    }),
    SharedModule,
  ],
  exports: [
    RouterModule,
  ],
  providers: [
    LoggedUserGuard
  ],
})
export class UiRoutingModule { }
