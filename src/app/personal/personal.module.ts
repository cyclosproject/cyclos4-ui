import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { SearchNotificationsComponent } from 'app/personal/search-notifications.component';
import { PersonalRoutingModule } from 'app/personal/personal-routing.module';
import { ManagePasswordsComponent } from 'app/personal/passwords/manage-passwords.component';
import { ChangePasswordDialogComponent } from 'app/personal/passwords/change-password-dialog.component';


/**
 * Module for viewing notifications
 */
@NgModule({
  declarations: [
    SearchNotificationsComponent,
    ManagePasswordsComponent,
    ChangePasswordDialogComponent
  ],
  imports: [
    PersonalRoutingModule,
    SharedModule
  ],
  entryComponents: [
    ChangePasswordDialogComponent
  ]
})
export class PersonalModule { }
