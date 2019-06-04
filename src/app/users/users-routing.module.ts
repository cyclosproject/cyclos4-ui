import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { Menu } from 'app/shared/menu';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { ViewUserStatusHistoryComponent } from 'app/users/status/view-user-status-history.component';
import { ViewUserStatusComponent } from 'app/users/status/view-user-status.component';
import { SearchUserOperatorsComponent } from 'app/users/operators/search-user-operators.component';


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
        path: 'public-search',
        component: SearchUsersComponent,
        data: {
          menu: Menu.PUBLIC_DIRECTORY
        }
      },
      {
        path: 'profile',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.MY_PROFILE
        }
      },
      {
        path: 'profile/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.EDIT_MY_PROFILE
        }
      },
      {
        path: ':key/profile',
        component: ViewProfileComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: ':key/profile/edit',
        component: EditProfileComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: 'operators',
        component: SearchUserOperatorsComponent,
        data: {
          menu: Menu.MY_OPERATORS
        }
      },
      {
        path: ':key/operator-profile',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_OPERATORS
        }
      },
      {
        path: ':key/operator-profile/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_OPERATORS
        }
      },
      {
        path: ':key/status',
        component: ViewUserStatusComponent,
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: ':key/status/history',
        component: ViewUserStatusHistoryComponent,
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: 'validate-email-change/:key',
        component: ValidateEmailChangeComponent,
        data: {
          menu: Menu.REGISTRATION
        }
      },
      {
        path: 'contacts',
        component: ContactListComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.CONTACTS
        }
      },
      {
        path: ':key/contact-profile',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.CONTACTS
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
