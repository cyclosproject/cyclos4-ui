import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Menu } from 'app/shared/menu';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';

import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { ViewUserStatusComponent } from 'app/users/status/view-user-status.component';

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
        path: 'profile/:key',
        component: ViewProfileComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.USER_PROFILE
        }
      },
      {
        path: 'profile/:key/edit',
        component: EditProfileComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.EDIT_USER_PROFILE
        }
      },
      {
        path: 'status/:key',
        component: ViewUserStatusComponent,
        data: {
          menu: Menu.VIEW_USER_STATUS
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
        path: 'contact-profile/:key',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: Menu.CONTACT_PROFILE
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
