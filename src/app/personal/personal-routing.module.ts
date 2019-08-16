import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { SearchNotificationsComponent } from 'app/personal/notifications/search-notifications.component';
import { ManageSettingsComponent } from 'app/personal/settings/manage-settings.component';
import { Menu } from 'app/shared/menu';
import { NotificationSettingsFormComponent } from 'app/personal/notifications/notification-settings-form.component';

const personalRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'notifications',
        component: SearchNotificationsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.NOTIFICATIONS
        }
      },
      {
        path: ':user/notification-settings',
        component: NotificationSettingsFormComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.NOTIFICATIONS_SETTINGS
        }
      },
      {
        path: 'settings',
        component: ManageSettingsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SETTINGS
        }
      }
    ]
  }
];

/**
 * * Routes for the personal module
 */
@NgModule({
  imports: [
    RouterModule.forChild(personalRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class PersonalRoutingModule {
}
