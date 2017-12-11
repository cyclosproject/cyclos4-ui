import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from 'app/login/login.component';
import { HomeComponent } from 'app/home/home.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { SharedModule } from 'app/shared/shared.module';
import { DataForLoginResolve } from 'app/data-for-login.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { RegistrationGroupsResolve } from 'app/registration-groups.resolve';
import { Menu } from 'app/shared/menu';

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
      dataForLogin: DataForLoginResolve,
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
    HomeComponent
  ],
  exports: [
    RouterModule
  ],
  providers: [
    DataForLoginResolve,
    RegistrationGroupsResolve,
    LoggedUserGuard
  ]
})
export class AppRoutingModule { }
