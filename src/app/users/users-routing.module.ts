import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleEnum } from 'app/api/models';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { LoginService } from 'app/core/login.service';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { ConditionalMenu, Menu } from 'app/shared/menu';
import { ListOperatorGroupsComponent } from 'app/users/operator-groups/list-operator-groups.component';
import { ViewOperatorGroupComponent } from 'app/users/operator-groups/view-operator-group.component';
import { OperatorRegistrationComponent } from 'app/users/operators/operator-registration.component';
import { SearchUserOperatorsComponent } from 'app/users/operators/search-user-operators.component';
import { ManagePasswordsComponent } from 'app/users/passwords/manage-passwords.component';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { UserRegistrationComponent } from 'app/users/registration/user-registration.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { ViewUserStatusHistoryComponent } from 'app/users/status/view-user-status-history.component';
import { ViewUserStatusComponent } from 'app/users/status/view-user-status.component';
import { SearchConnectedComponent } from 'app/users/connected/search-connected.component';
import { SearchUserAlertsComponent } from 'app/users/alerts/search-user-alerts.component';
import { OperatorGroupFormComponent } from 'app/users/operator-groups/operator-group-form.component';
import { ViewUserGroupComponent } from 'app/users/group-membership/view-user-group.component';
import { ViewUserGroupHistoryComponent } from 'app/users/group-membership/view-user-group-history.component';
import { ListUserBrokersComponent } from 'app/users/brokering/list-user-brokers.component';
import { BrokerFormComponent } from 'app/users/brokering/broker-form.component';
import { ViewBrokerHistoryComponent } from 'app/users/brokering/view-broker-history.component';

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

const OperatorGroupsMenu: ConditionalMenu = injector => {
  const login = injector.get(LoginService);
  const auth = login.auth || {};
  const role = auth.role;
  if (role === RoleEnum.ADMINISTRATOR) {
    return Menu.SEARCH_USERS;
  } else if (role === RoleEnum.BROKER) {
    return Menu.MY_BROKERED_USERS;
  } else {
    return Menu.OPERATOR_GROUPS;
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
        path: ':user/brokerings',
        component: SearchUsersComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: ':user/brokers',
        component: ListUserBrokersComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: ':user/brokers/history',
        component: ViewBrokerHistoryComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: ':user/brokers/new',
        component: BrokerFormComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: ':user/profile',
        component: ViewProfileComponent,
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: AuthHelperService.menuByRole(Menu.MY_PROFILE, false)
        }
      },
      {
        path: ':user/profile/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        },
        data: {
          menu: AuthHelperService.menuByRole(Menu.MY_PROFILE)
        }
      },
      {
        path: 'operators',
        component: SearchUserOperatorsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_OPERATORS
        }
      },
      {
        path: ':user/operators',
        component: SearchUserOperatorsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SEARCH_USERS
        }
      },
      {
        path: ':user/operators/registration',
        component: OperatorRegistrationComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: AuthHelperService.menuByRole(Menu.REGISTER_OPERATOR)
        }
      },
      {
        path: 'operators/:user',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_OPERATORS
        }
      },
      {
        path: 'operators/:user/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.MY_OPERATORS
        }
      },
      {
        path: ':user/status',
        component: ViewUserStatusComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: AuthHelperService.menuByRole(null)
        }
      },
      {
        path: ':user/status/history',
        component: ViewUserStatusHistoryComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: AuthHelperService.menuByRole(null)
        }
      },
      {
        path: ':user/group',
        component: ViewUserGroupComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: AuthHelperService.menuByRole(null)
        }
      },
      {
        path: ':user/group/history',
        component: ViewUserGroupHistoryComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: AuthHelperService.menuByRole(null)
        }
      },
      {
        path: 'operator-groups',
        component: ListOperatorGroupsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.OPERATOR_GROUPS
        }
      },
      {
        path: ':user/operator-groups',
        component: ListOperatorGroupsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: OperatorGroupsMenu
        }
      },
      {
        path: ':user/operator-groups/new',
        component: OperatorGroupFormComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: OperatorGroupsMenu
        }
      },
      {
        path: 'operator-groups/:id',
        component: ViewOperatorGroupComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: OperatorGroupsMenu
        }
      },
      {
        path: 'operator-groups/:id/edit',
        component: OperatorGroupFormComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: OperatorGroupsMenu
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
        path: 'contacts/:user',
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
        path: ':user/passwords',
        component: ManagePasswordsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: AuthHelperService.menuByRole(Menu.PASSWORDS)
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
      },
      {
        path: 'connected',
        component: SearchConnectedComponent,
        data: {
          menu: Menu.CONNECTED_USERS
        }
      },
      {
        path: 'alerts',
        component: SearchUserAlertsComponent,
        data: {
          menu: Menu.USER_ALERTS
        }
      },
      {
        path: 'validate-email-change/:key',
        component: ValidateEmailChangeComponent,
        data: {
          menu: Menu.PUBLIC_REGISTRATION
        }
      },
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
