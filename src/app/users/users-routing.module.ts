import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Menu } from 'app/shared/menu';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { ViewUserProfileComponent } from 'app/users/profile/view-user-profile.component';
import { EditMyProfileComponent } from 'app/users/profile/edit-my-profile.component';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';

const usersRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchUsersComponent,
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: 'my-profile',
        component: ViewUserProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.MY_PROFILE
        }
      },
      {
        path: 'edit-my-profile',
        component: EditMyProfileComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.EDIT_MY_PROFILE
        }
      },
      {
        path: 'profile/:key',
        component: ViewUserProfileComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.USER_PROFILE
        }
      },
      {
        path: 'registration',
        component: PublicRegistrationComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.REGISTRATION
        }
      },
      {
        path: 'validate-registration/:key',
        component: ValidateRegistrationComponent,
        data: {
          menu: Menu.REGISTRATION
        }
      }
    ]
  }
];

/**
 * * Routes for the users module
 */
@NgModule({
  imports: [
    RouterModule.forChild(usersRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class UsersRoutingModule {
}
