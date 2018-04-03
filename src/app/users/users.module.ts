import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { RegistrationGroupComponent } from 'app/users/registration/registration-group.component';
import { RegistrationFieldsComponent } from 'app/users/registration/registration-fields.component';
import { UsersRoutingModule } from 'app/users/users-routing.module';
import { RegistrationConfirmComponent } from 'app/users/registration/registration-confirm.component';
import { RegistrationDoneComponent } from 'app/users/registration/registration-done.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { ViewAddressDetailsComponent } from 'app/users/profile/view-address-details.component';
import { ValidateRegistrationComponent } from './registration/validate-registration.component';
import { ViewUserProfileComponent } from 'app/users/profile/view-user-profile.component';
import { EditMyProfileComponent } from 'app/users/profile/edit-my-profile.component';
import { UserFieldsFormComponent } from 'app/users/profile/user-fields-form.component';

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
    PublicRegistrationComponent,
    RegistrationGroupComponent,
    RegistrationFieldsComponent,
    RegistrationConfirmComponent,
    RegistrationDoneComponent,

    ValidateRegistrationComponent,

    SearchUsersComponent,
    ViewUserProfileComponent,
    ViewAddressDetailsComponent,
    EditMyProfileComponent,
    UserFieldsFormComponent
  ]
})
export class UsersModule {
}
