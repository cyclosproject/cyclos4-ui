import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from 'app/login/login.component';
import { HomeComponent } from 'app/home/home.component';
import { DashboardComponent } from 'app/home/dashboard.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { SharedModule } from 'app/shared/shared.module';
import { DataForLoginResolve } from 'app/data-for-login.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { Menu } from 'app/shared/menu';
import { RegistrationGroupsResolve } from 'app/registration-groups.resolve';

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
    resolve: {
      registrationGroups: RegistrationGroupsResolve
    },
    data: {
      menu: Menu.LOGIN
    }
  },
  {
    path: 'users',
    loadChildren: 'app/users/users.module#UsersModule'
  },
  {
    path: 'banking',
    loadChildren: 'app/banking/banking.module#BankingModule'
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
  declarations: [
    HomeComponent,
    DashboardComponent
  ],
  exports: [
    RouterModule
  ],
  providers: [
    DataForLoginResolve,
    LoggedUserGuard
  ]
})
export class AppRoutingModule { }
