import { NgModule } from '@angular/core';
import { SearchNotificationsComponent } from 'app/personal/notifications/search-notifications.component';
import { ChangePasswordDialogComponent } from 'app/personal/passwords/change-password-dialog.component';
import { ManagePasswordsComponent } from 'app/personal/passwords/manage-passwords.component';
import { PersonalRoutingModule } from 'app/personal/personal-routing.module';
import { SharedModule } from 'app/shared/shared.module';


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
