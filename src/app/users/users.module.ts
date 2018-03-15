import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { RegistrationGroupComponent } from 'app/users/registration/registration-group.component';
import { RegistrationFieldsComponent } from 'app/users/registration/registration-fields.component';
import { UsersRoutingModule } from 'app/users/users-routing.module';
import { RegistrationConfirmComponent } from 'app/users/registration/registration-confirm.component';
import { RegistrationDoneComponent } from 'app/users/registration/registration-done.component';
import { SearchUsersComponent } from 'app/users/search/search-users.component';
import { UserProfileComponent } from 'app/users/profile/user-profile.component';
import { ViewAddressDetailsComponent } from 'app/users/profile/view-address-details.component';

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

    SearchUsersComponent,
    UserProfileComponent,
    ViewAddressDetailsComponent
  ]
})
export class UsersModule {
}
