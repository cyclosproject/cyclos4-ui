import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { SearchUserAlertsComponent } from 'app/users/alerts/search-user-alerts.component';
import { BrokerFormComponent } from 'app/users/brokering/broker-form.component';
import { ListUserBrokersComponent } from 'app/users/brokering/list-user-brokers.component';
import { ViewBrokerHistoryComponent } from 'app/users/brokering/view-broker-history.component';
import { SearchConnectedComponent } from 'app/users/connected/search-connected.component';
import { ViewUserGroupHistoryComponent } from 'app/users/group-membership/view-user-group-history.component';
import { ViewUserGroupComponent } from 'app/users/group-membership/view-user-group.component';
import { ListOperatorGroupsComponent } from 'app/users/operator-groups/list-operator-groups.component';
import { OperatorGroupFormComponent } from 'app/users/operator-groups/operator-group-form.component';
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
import { NotificationSettingsFormComponent } from 'app/users/notification-settings/notification-settings-form.component';

const usersRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchUsersComponent
      },
      {
        path: 'brokerings',
        component: SearchUsersComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/brokerings',
        component: SearchUsersComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/brokers',
        component: ListUserBrokersComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/brokers/history',
        component: ViewBrokerHistoryComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/brokers/new',
        component: BrokerFormComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/profile',
        component: ViewProfileComponent,
        resolve: {
          countries: CountriesResolve
        }
      },
      {
        path: ':user/profile/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        }
      },
      {
        path: 'operators',
        component: SearchUserOperatorsComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/operators',
        component: SearchUserOperatorsComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/operators/registration',
        component: OperatorRegistrationComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'operators/:user',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'operators/:user/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/status',
        component: ViewUserStatusComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/status/history',
        component: ViewUserStatusHistoryComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/group',
        component: ViewUserGroupComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/group/history',
        component: ViewUserGroupHistoryComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'operator-groups',
        component: ListOperatorGroupsComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/operator-groups',
        component: ListOperatorGroupsComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: ':user/operator-groups/new',
        component: OperatorGroupFormComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'operator-groups/:id',
        component: ViewOperatorGroupComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'operator-groups/:id/edit',
        component: OperatorGroupFormComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'contacts',
        component: ContactListComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'contacts/:user',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve
        }
      },
      {
        path: ':user/passwords',
        component: ManagePasswordsComponent,
        canActivate: [LoggedUserGuard]
      },
      {
        path: 'registration',
        component: UserRegistrationComponent,
        resolve: {
          countries: CountriesResolve
        }
      },
      {
        path: 'validate-registration/:key',
        component: ValidateRegistrationComponent
      },
      {
        path: 'connected',
        component: SearchConnectedComponent
      },
      {
        path: 'alerts',
        component: SearchUserAlertsComponent
      },
      {
        path: 'validate-email-change/:key',
        component: ValidateEmailChangeComponent
      },
      {
        path: ':user/notification-settings',
        component: NotificationSettingsFormComponent,
        canActivate: [LoggedUserGuard]
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
