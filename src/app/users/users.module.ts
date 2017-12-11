import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { UsersMessages } from 'app/messages/users-messages';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';
import { RegistrationGroupComponent } from 'app/users/registration/registration-group.component';
import { RegistrationFieldsComponent } from 'app/users/registration/registration-fields.component';
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
    PublicRegistrationComponent,
    RegistrationGroupComponent,
    RegistrationFieldsComponent
  ],
  providers: [
    UsersMessages
  ]
})
export class UsersModule {
}
