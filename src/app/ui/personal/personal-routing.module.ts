import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';
import { SearchNotificationsComponent } from 'app/ui/personal/notifications/search-notifications.component';
import { ManageSettingsComponent } from 'app/ui/personal/settings/manage-settings.component';
import { Menu } from 'app/ui/shared/menu';

const personalRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'notifications',
        component: SearchNotificationsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.NOTIFICATIONS,
        },
      },
      {
        path: 'settings',
        component: ManageSettingsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.SETTINGS,
        },
      },
    ],
  },
];

/**
 * * Routes for the personal module
 */
@NgModule({
  imports: [
    RouterModule.forChild(personalRoutes),
  ],
  exports: [
    RouterModule,
  ],
})
export class PersonalRoutingModule {
}
