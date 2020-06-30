import { NgModule } from '@angular/core';
import { EditPrivacySettingsComponent } from 'app/personal/privacy-settings/edit-privacy-settings.component';
import { ViewPrivacySettingsComponent } from 'app/personal/privacy-settings/view-privacy-settings.component';
import { SharedModule } from 'app/shared/shared.module';
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
import { ChangePasswordDialogComponent } from 'app/users/passwords/change-password-dialog.component';
import { ManagePasswordsComponent } from 'app/users/passwords/manage-passwords.component';
import { ListProductAssignmentComponent } from 'app/users/products/list-product-assignment.component';
import { ViewProductAssignmentHistoryComponent } from 'app/users/products/view-product-assignment-history.component';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { VerifyPhoneComponent } from 'app/users/profile/verify-phone.component';
import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { RegistrationStepConfirmComponent } from 'app/users/registration/registration-step-confirm.component';
import { RegistrationStepDoneComponent } from 'app/users/registration/registration-step-done.component';
import { RegistrationStepFieldsComponent } from 'app/users/registration/registration-step-fields.component';
import { RegistrationStepGroupComponent } from 'app/users/registration/registration-step-group.component';
import { RegistrationStepIdPComponent } from 'app/users/registration/registration-step-idp.component';
import { UserRegistrationComponent } from 'app/users/registration/user-registration.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { AddContactDialogComponent } from 'app/users/search/add-contact-dialog.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { UsersResultsComponent } from 'app/users/search/users-results.component';
import { ViewUserStatusHistoryComponent } from 'app/users/status/view-user-status-history.component';
import { ViewUserStatusComponent } from 'app/users/status/view-user-status.component';
import { AssignTokenComponent } from 'app/users/tokens/assign-token.component';
import { CreateTokenComponent } from 'app/users/tokens/create-token.component';
import { ListTokenComponent } from 'app/users/tokens/list-token.component';
import { SearchTokenComponent } from 'app/users/tokens/search-token.component';
import { ViewTokenComponent } from 'app/users/tokens/view-token.component';
import { UsersRoutingModule } from 'app/users/users-routing.module';

/**
 * Users module
 */
@NgModule({
  imports: [
    UsersRoutingModule,
    SharedModule,
  ],
  exports: [],
  declarations: [
    SearchConnectedComponent,
    SearchUsersComponent,
    UsersResultsComponent,
    ContactListComponent,
    AddContactDialogComponent,

    ViewProfileComponent,
    EditProfileComponent,
    VerifyPhoneComponent,
    ValidateEmailChangeComponent,

    UserRegistrationComponent,
    RegistrationStepGroupComponent,
    RegistrationStepIdPComponent,
    RegistrationStepFieldsComponent,
    RegistrationStepConfirmComponent,
    RegistrationStepDoneComponent,
    ValidateRegistrationComponent,

    SearchUserOperatorsComponent,
    OperatorRegistrationComponent,
    ListOperatorGroupsComponent,
    ViewOperatorGroupComponent,
    OperatorGroupFormComponent,

    ViewUserStatusComponent,
    ViewUserStatusHistoryComponent,

    SearchUserAlertsComponent,

    ViewUserGroupComponent,
    ViewUserGroupHistoryComponent,

    ViewUserAgreementsComponent,
    ViewAgreementsHistoryComponent,

    ListUserBrokersComponent,
    BrokerFormComponent,
    ViewBrokerHistoryComponent,

    ManagePasswordsComponent,
    ChangePasswordDialogComponent,

    UserIdentityProvidersComponent,

    NotificationSettingsFormComponent,

    ViewDocumentComponent,
    EditDocumentComponent,
    ProcessDynamicDocumentComponent,
    ListDocumentsComponent,
    SearchDocumentsComponent,

    AssignTokenComponent,
    CreateTokenComponent,
    ViewTokenComponent,
    ListTokenComponent,
    SearchTokenComponent,

    ListProductAssignmentComponent,
    ViewProductAssignmentHistoryComponent,

    EditPrivacySettingsComponent,
    ViewPrivacySettingsComponent
  ],
  entryComponents: [
    VerifyPhoneComponent,
    AddContactDialogComponent,
    ChangePasswordDialogComponent,
  ],
})
export class UsersModule {
}
