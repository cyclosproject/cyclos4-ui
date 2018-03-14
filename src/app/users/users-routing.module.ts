import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersMessagesResolve } from 'app/users/users-messages.resolve';
import { Menu } from 'app/shared/menu';
import { RegistrationGroupsResolve } from 'app/registration-groups.resolve';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { UserProfileComponent } from 'app/users/profile/user-profile.component';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';

const usersRoutes: Routes = [
  {
    path: '',
    resolve: {
      usersMessages: UsersMessagesResolve
    },
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
        component: UserProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.MY_PROFILE
        }
      },
      {
        path: 'profile/:key',
        component: UserProfileComponent,
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
          groups: RegistrationGroupsResolve,
          countries: CountriesResolve
        },
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
  ],
  providers: [
    UsersMessagesResolve
  ]
})
export class UsersRoutingModule { }
