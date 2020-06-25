import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CountriesResolve } from 'app/countries.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { ViewAgreementsHistoryComponent } from 'app/users/agreements/view-agreements-history.component';
import { ViewUserAgreementsComponent } from 'app/users/agreements/view-user-agreements.component';
import { SearchUserAlertsComponent } from 'app/users/alerts/search-user-alerts.component';
import { BrokerFormComponent } from 'app/users/brokering/broker-form.component';
import { ListUserBrokersComponent } from 'app/users/brokering/list-user-brokers.component';
import { ViewBrokerHistoryComponent } from 'app/users/brokering/view-broker-history.component';
import { SearchConnectedComponent } from 'app/users/connected/search-connected.component';
import { EditDocumentComponent } from 'app/users/documents/edit-document.component';
import { ListDocumentsComponent } from 'app/users/documents/list-documents.component';
import { ProcessDynamicDocumentComponent } from 'app/users/documents/process-dynamic-document.component';
import { SearchDocumentsComponent } from 'app/users/documents/search-documents.component';
import { ViewDocumentComponent } from 'app/users/documents/view-document.component';
import { ViewUserGroupHistoryComponent } from 'app/users/group-membership/view-user-group-history.component';
import { ViewUserGroupComponent } from 'app/users/group-membership/view-user-group.component';
import { UserIdentityProvidersComponent } from 'app/users/identity-providers/user-identity-providers.component';
import { NotificationSettingsFormComponent } from 'app/users/notification-settings/notification-settings-form.component';
import { ListOperatorGroupsComponent } from 'app/users/operator-groups/list-operator-groups.component';
import { OperatorGroupFormComponent } from 'app/users/operator-groups/operator-group-form.component';
import { ViewOperatorGroupComponent } from 'app/users/operator-groups/view-operator-group.component';
import { OperatorRegistrationComponent } from 'app/users/operators/operator-registration.component';
import { SearchUserOperatorsComponent } from 'app/users/operators/search-user-operators.component';
import { ManagePasswordsComponent } from 'app/users/passwords/manage-passwords.component';
import { ListProductAssignmentComponent } from 'app/users/products/list-product-assignment.component';
import { ViewProductAssignmentHistoryComponent } from 'app/users/products/view-product-assignment-history.component';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { UserRegistrationComponent } from 'app/users/registration/user-registration.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { ViewUserStatusHistoryComponent } from 'app/users/status/view-user-status-history.component';
import { ViewUserStatusComponent } from 'app/users/status/view-user-status.component';
import { ListTokenComponent } from 'app/users/tokens/list-token.component';
import { SearchTokenComponent } from 'app/users/tokens/search-token.component';
import { ViewTokenComponent } from 'app/users/tokens/view-token.component';

const usersRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchUsersComponent,
      },
      {
        path: 'brokerings',
        component: SearchUsersComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/brokerings',
        component: SearchUsersComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/brokers',
        component: ListUserBrokersComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/brokers/history',
        component: ViewBrokerHistoryComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/brokers/new',
        component: BrokerFormComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/profile',
        component: ViewProfileComponent,
        resolve: {
          countries: CountriesResolve,
        },
      },
      {
        path: ':user/profile/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve,
        },
      },
      {
        path: 'operators',
        component: SearchUserOperatorsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/operators',
        component: SearchUserOperatorsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/operators/registration',
        component: OperatorRegistrationComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'operators/:user',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'operators/:user/edit',
        component: EditProfileComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/status',
        component: ViewUserStatusComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/status/history',
        component: ViewUserStatusHistoryComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/group',
        component: ViewUserGroupComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/group/history',
        component: ViewUserGroupHistoryComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/agreements',
        component: ViewUserAgreementsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/agreements/history',
        component: ViewAgreementsHistoryComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'operator-groups',
        component: ListOperatorGroupsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/operator-groups',
        component: ListOperatorGroupsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/operator-groups/new',
        component: OperatorGroupFormComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'operator-groups/:id',
        component: ViewOperatorGroupComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'operator-groups/:id/edit',
        component: OperatorGroupFormComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'contacts',
        component: ContactListComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'contacts/:user',
        component: ViewProfileComponent,
        canActivate: [LoggedUserGuard],
        resolve: {
          countries: CountriesResolve,
        },
      },
      {
        path: ':user/passwords',
        component: ManagePasswordsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/identity-providers',
        component: UserIdentityProvidersComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'registration',
        component: UserRegistrationComponent,
        resolve: {
          countries: CountriesResolve,
        },
      },
      {
        path: 'validate-registration/:key',
        component: ValidateRegistrationComponent,
      },
      {
        path: 'connected',
        component: SearchConnectedComponent,
      },
      {
        path: 'alerts',
        component: SearchUserAlertsComponent,
      },
      {
        path: 'validate-email-change/:key',
        component: ValidateEmailChangeComponent,
      },
      {
        path: ':user/notification-settings',
        component: NotificationSettingsFormComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'documents',
        component: ListDocumentsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/documents/search',
        component: SearchDocumentsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'documents/edit/:id',
        component: EditDocumentComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'documents/view/:id',
        component: ViewDocumentComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/documents/new',
        component: EditDocumentComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'documents/process-dynamic/:id',
        component: ProcessDynamicDocumentComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/tokens/:type',
        component: ListTokenComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'tokens/search/:type',
        component: SearchTokenComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'tokens/view/:id',
        component: ViewTokenComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/product-assignment',
        component: ListProductAssignmentComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/product-assignment/history',
        component: ViewProductAssignmentHistoryComponent,
        canActivate: [LoggedUserGuard],
      },
    ],
  },
];

/**
 * * Routes for the users module
 */
@NgModule({
  imports: [
    RouterModule.forChild(usersRoutes),
  ],
  exports: [
    RouterModule,
  ],
})
export class UsersRoutingModule {
}
