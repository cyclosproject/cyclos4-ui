import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { SearchUserOperatorsComponent } from 'app/users/operators/search-user-operators.component';
import { AddressFormComponent } from 'app/users/profile/address-form.component';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { VerifyPhoneComponent } from 'app/users/profile/verify-phone.component';
import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { RegistrationStepConfirmComponent } from 'app/users/registration/registration-step-confirm.component';
import { RegistrationStepDoneComponent } from 'app/users/registration/registration-step-done.component';
import { RegistrationStepFieldsComponent } from 'app/users/registration/registration-step-fields.component';
import { RegistrationStepGroupComponent } from 'app/users/registration/registration-step-group.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { AddContactDialogComponent } from 'app/users/search/add-contact-dialog.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { UsersResultsComponent } from 'app/users/search/users-results.component';
import { ViewUserStatusHistoryComponent } from 'app/users/status/view-user-status-history.component';
import { ViewUserStatusComponent } from 'app/users/status/view-user-status.component';
import { UsersRoutingModule } from 'app/users/users-routing.module';


/**
 * Users module
 */
@NgModule({
  imports: [
    UsersRoutingModule,
    SharedModule
  ],
  exports: [],
  declarations: [
    SearchUsersComponent,
    UsersResultsComponent,
    ContactListComponent,
    AddContactDialogComponent,
    SearchUserOperatorsComponent,

    ViewProfileComponent,
    EditProfileComponent,
    AddressFormComponent,
    VerifyPhoneComponent,
    ValidateEmailChangeComponent,

    PublicRegistrationComponent,
    RegistrationStepGroupComponent,
    RegistrationStepFieldsComponent,
    RegistrationStepConfirmComponent,
    RegistrationStepDoneComponent,
    ValidateRegistrationComponent,

    ViewUserStatusComponent,
    ViewUserStatusHistoryComponent
  ],
  entryComponents: [
    VerifyPhoneComponent,
    AddContactDialogComponent
  ]
})
export class UsersModule {
}
