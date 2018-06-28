import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { ManagePasswordsComponent } from 'app/personal/passwords/manage-passwords.component';
import { PersonalRoutingModule } from 'app/personal/personal-routing.module';
import { ChangePasswordFormComponent } from 'app/personal/passwords/change-password-form.component';

/**
 * Personal module
 */
@NgModule({
  imports: [
    PersonalRoutingModule,
    SharedModule
  ],
  exports: [],
  declarations: [
    ManagePasswordsComponent,
    ChangePasswordFormComponent
  ],
  entryComponents: [
    ChangePasswordFormComponent
  ]
})
export class PersonalModule {
}
