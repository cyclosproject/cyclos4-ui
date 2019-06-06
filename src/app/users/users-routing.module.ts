import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { Menu, ConditionalMenu } from 'app/shared/menu';
import { SearchUserOperatorsComponent } from 'app/users/operators/search-user-operators.component';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { UserRegistrationComponent } from 'app/users/registration/user-registration.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { ViewUserStatusHistoryComponent } from 'app/users/status/view-user-status-history.component';
import { ViewUserStatusComponent } from 'app/users/status/view-user-status.component';
import { LoginService } from 'app/core/login.service';
import { RoleEnum } from 'app/api/models';
import { OperatorRegistrationComponent } from 'app/users/operators/operator-registration.component';

const SearchMenu: ConditionalMenu = injector => {
  const login = injector.get(LoginService);
  if (login.user) {
    return Menu.SEARCH_USERS;
  } else {
    return Menu.PUBLIC_DIRECTORY;
  }
};

const RegistrationMenu: ConditionalMenu = injector => {
  const login = injector.get(LoginService);
  const auth = login.auth || {};
  const role = auth.role;
  if (role === RoleEnum.ADMINISTRATOR) {
    return Menu.ADMIN_REGISTRATION;
  } else if (role === RoleEnum.BROKER) {
    return Menu.BROKER_REGISTRATION;
  } else {
    return Menu.PUBLIC_REGISTRATION;
  }
};

const OperatorRegistrationMenu: ConditionalMenu = injector => {
  const login = injector.get(LoginService);
  const auth = login.auth || {};
  const role = auth.role;
  if (role === RoleEnum.ADMINISTRATOR) {
    return Menu.SEARCH_USERS;
  } else if (role === RoleEnum.BROKER) {
    return Menu.MY_BROKERED_USERS;
  } else {
    return Menu.REGISTER_OPERATOR;
  }
};

const usersRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchUsersComponent,
        data: {
          menu: SearchMenu
        }
      },
      {
        path: 'brokerings',
        component: SearchUsersComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_BROKERED_USERS
        }
      },
      {
        path: ':key/brokerings',
        component: SearchUsersComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SEARCH_USERS
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
        path: ':key/operators',
        component: SearchUserOperatorsComponent,
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: 'operators/registration',
        component: OperatorRegistrationComponent,
        data: {
          menu: Menu.REGISTER_OPERATOR
        }
      },
      {
        path: ':key/operators/registration',
        component: OperatorRegistrationComponent,
        data: {
          menu: OperatorRegistrationMenu
        }
      },
      {
        path: 'operators/:key',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_OPERATORS
        }
      },
      {
        path: 'operators/:key/edit',
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
          menu: Menu.PUBLIC_REGISTRATION
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
        path: 'contacts/:key',
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
        component: UserRegistrationComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: RegistrationMenu
        }
      },
      {
        path: 'validate-registration/:key',
        component: ValidateRegistrationComponent,
        data: {
          menu: Menu.PUBLIC_REGISTRATION
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
