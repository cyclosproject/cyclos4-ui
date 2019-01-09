import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { UsersRoutingModule } from 'app/users/users-routing.module';

import { ViewProfileComponent } from 'app/users/profile/view-profile.component';
import { EditProfileComponent } from 'app/users/profile/edit-profile.component';
import { AddressFormComponent } from 'app/users/profile/address-form.component';
import { VerifyPhoneComponent } from 'app/users/profile/verify-phone.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { UsersResultsComponent } from 'app/users/search/users-results.component';
import { ContactListComponent } from 'app/users/search/contact-list.component';
import { ManagePasswordsComponent } from 'app/users/passwords/manage-passwords.component';
import { ChangePasswordDialogComponent } from 'app/users/passwords/change-password-dialog.component';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { RegistrationStepGroupComponent } from 'app/users/registration/registration-step-group.component';
import { RegistrationStepFieldsComponent } from 'app/users/registration/registration-step-fields.component';
import { RegistrationStepConfirmComponent } from 'app/users/registration/registration-step-confirm.component';
import { RegistrationStepDoneComponent } from 'app/users/registration/registration-step-done.component';
import { ValidateRegistrationComponent } from 'app/users/registration/validate-registration.component';
import { ValidateEmailChangeComponent } from 'app/users/profile/validate-email-change.component';
import { AddContactDialogComponent } from 'app/users/search/add-contact-dialog.component';

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

    ManagePasswordsComponent,
    ChangePasswordDialogComponent
  ],
  entryComponents: [
    VerifyPhoneComponent,
    ChangePasswordDialogComponent,
    AddContactDialogComponent
  ]
})
export class UsersModule {
}
