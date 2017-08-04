import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from "app/app.component";
import { LoginComponent } from "app/login/login.component";
import { HomeComponent } from "app/home/home.component";
import { NotFoundComponent } from "app/shared/not-found.component";
import { DataForLoginResolve } from "app/routing/data-for-login.resolve";
import { SharedModule } from "app/shared/shared.module";
import { RegistrationGroupsResolve } from "app/routing/registration-groups.resolve";
import { LoggedUserGuard } from "app/routing/logged-user-guard";

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
    component: LoginComponent,
    resolve: {
      dataForLogin: DataForLoginResolve,
      registrationGroups: RegistrationGroupsResolve
    }
  },
  {
    path: 'accounts',
    loadChildren: 'app/accounts/accounts.module#AccountsModule'
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
    RouterModule.forRoot(rootRoutes),
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