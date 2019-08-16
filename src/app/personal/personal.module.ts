import { NgModule } from '@angular/core';
import { SearchNotificationsComponent } from 'app/personal/notifications/search-notifications.component';
import { PersonalRoutingModule } from 'app/personal/personal-routing.module';
import { ManageSettingsComponent } from 'app/personal/settings/manage-settings.component';
import { SharedModule } from 'app/shared/shared.module';
import { NotificationSettingsFormComponent } from 'app/personal/notifications/notification-settings-form.component';


/**
 * Module for viewing notifications
 */
@NgModule({
  declarations: [
    SearchNotificationsComponent,
    ManageSettingsComponent,
    NotificationSettingsFormComponent
  ],
  imports: [
    PersonalRoutingModule,
    SharedModule
  ],
})
export class PersonalModule { }
