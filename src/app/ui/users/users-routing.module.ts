import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CountriesResolve } from 'app/ui/countries.resolve';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';
import { EditPrivacySettingsComponent } from 'app/ui/personal/privacy-settings/edit-privacy-settings.component';
import { ViewPrivacySettingsComponent } from 'app/ui/personal/privacy-settings/view-privacy-settings.component';
import { ViewAgreementsHistoryComponent } from 'app/ui/users/agreements/view-agreements-history.component';
import { ViewUserAgreementsComponent } from 'app/ui/users/agreements/view-user-agreements.component';
import { SearchUserAlertsComponent } from 'app/ui/users/alerts/search-user-alerts.component';
import { BrokerFormComponent } from 'app/ui/users/brokering/broker-form.component';
import { ListUserBrokersComponent } from 'app/ui/users/brokering/list-user-brokers.component';
import { ViewBrokerHistoryComponent } from 'app/ui/users/brokering/view-broker-history.component';
import { SearchConnectedComponent } from 'app/ui/users/connected/search-connected.component';
import { EditDocumentComponent } from 'app/ui/users/documents/edit-document.component';
import { ListDocumentsComponent } from 'app/ui/users/documents/list-documents.component';
import { ProcessDynamicDocumentComponent } from 'app/ui/users/documents/process-dynamic-document.component';
import { SearchDocumentsComponent } from 'app/ui/users/documents/search-documents.component';
import { ViewDocumentComponent } from 'app/ui/users/documents/view-document.component';
import { ListFeedbackIgnoredUsersComponent } from 'app/ui/users/feedbacks/list-feedback-ignored-users.component';
import { SearchFeedbackComponent } from 'app/ui/users/feedbacks/search-feedbacks.component';
import { SearchPaymentAwaitingFeedbackComponent } from 'app/ui/users/feedbacks/search-payment-awaiting-feedback.component';
import { SetFeedbackComponent } from 'app/ui/users/feedbacks/set-feedback.component';
import { ViewFeedbackComponent } from 'app/ui/users/feedbacks/view-feedback.component';
import { ViewUserGroupHistoryComponent } from 'app/ui/users/group-membership/view-user-group-history.component';
import { ViewUserGroupComponent } from 'app/ui/users/group-membership/view-user-group.component';
import { UserIdentityProvidersComponent } from 'app/ui/users/identity-providers/user-identity-providers.component';
import { EditMessageComponent } from 'app/ui/users/messages/edit-message.component';
import { SearchMessagesComponent } from 'app/ui/users/messages/search-messages.component';
import { ViewMessageComponent } from 'app/ui/users/messages/view-message.component';
import { NotificationSettingsFormComponent } from 'app/ui/users/notification-settings/notification-settings-form.component';
import { ListOperatorGroupsComponent } from 'app/ui/users/operator-groups/list-operator-groups.component';
import { OperatorGroupFormComponent } from 'app/ui/users/operator-groups/operator-group-form.component';
import { ViewOperatorGroupComponent } from 'app/ui/users/operator-groups/view-operator-group.component';
import { OperatorRegistrationComponent } from 'app/ui/users/operators/operator-registration.component';
import { SearchUserOperatorsComponent } from 'app/ui/users/operators/search-user-operators.component';
import { ManagePasswordsComponent } from 'app/ui/users/passwords/manage-passwords.component';
import { ViewPasswordsHistoryComponent } from 'app/ui/users/passwords/view-passwords-history.component';
import { ListProductAssignmentComponent } from 'app/ui/users/products/list-product-assignment.component';
import { ViewProductAssignmentHistoryComponent } from 'app/ui/users/products/view-product-assignment-history.component';
import { EditProfileComponent } from 'app/ui/users/profile/edit-profile.component';
import { ValidateEmailChangeComponent } from 'app/ui/users/profile/validate-email-change.component';
import { ViewProfileComponent } from 'app/ui/users/profile/view-profile.component';
import { QuickAccessSettingsComponent } from 'app/ui/users/quick-access/quick-access-settings.component';
import { SearchReferencesComponent } from 'app/ui/users/references/search-references.component';
import { SetReferenceComponent } from 'app/ui/users/references/set-reference.component';
import { ViewReferenceComponent } from 'app/ui/users/references/view-reference.component';
import { UserRegistrationComponent } from 'app/ui/users/registration/user-registration.component';
import { ValidateRegistrationComponent } from 'app/ui/users/registration/validate-registration.component';
import { ContactListComponent } from 'app/ui/users/search/contact-list.component';
import { SearchUsersComponent } from 'app/ui/users/search/search-users.component';
import { ViewUserStatusHistoryComponent } from 'app/ui/users/status/view-user-status-history.component';
import { ViewUserStatusComponent } from 'app/ui/users/status/view-user-status.component';
import { ListTokenComponent } from 'app/ui/users/tokens/list-token.component';
import { SearchTokenComponent } from 'app/ui/users/tokens/search-token.component';
import { ViewTokenComponent } from 'app/ui/users/tokens/view-token.component';

const usersRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'search',
        component: SearchUsersComponent,
      },
      {
        path: 'search/pending',
        component: SearchUsersComponent,
      },
      {
        path: 'messages/search',
        component: SearchMessagesComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'messages/view/:id',
        component: ViewMessageComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'messages/send',
        component: EditMessageComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'messages/reply/:id',
        component: EditMessageComponent,
        canActivate: [LoggedUserGuard],
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
        path: ':user/passwords/history',
        component: ViewPasswordsHistoryComponent,
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
        path: 'registration/:externalPaymentToken',
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
      {
        path: ':user/privacy-settings',
        component: ViewPrivacySettingsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/privacy-settings/edit',
        component: EditPrivacySettingsComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'feedbacks/search-awaiting',
        component: SearchPaymentAwaitingFeedbackComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/feedbacks/search',
        component: SearchFeedbackComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/references/search',
        component: SearchReferencesComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'references/view/:id',
        component: ViewReferenceComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'feedbacks/view/:id',
        component: ViewFeedbackComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'references/set/:from/:to',
        component: SetReferenceComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'references/edit/:id',
        component: SetReferenceComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'feedbacks/set/:transactionId',
        component: SetFeedbackComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'feedbacks/edit/:id',
        component: SetFeedbackComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: 'feedbacks/settings',
        component: ListFeedbackIgnoredUsersComponent,
        canActivate: [LoggedUserGuard],
      },
      {
        path: ':user/quick-access/settings',
        component: QuickAccessSettingsComponent,
        canActivate: [LoggedUserGuard],
      }
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
