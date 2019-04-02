import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { ManagePasswordsComponent } from 'app/personal/passwords/manage-passwords.component';
import { SearchNotificationsComponent } from 'app/personal/notifications/search-notifications.component';
import { Menu } from 'app/shared/menu';

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
        path: 'passwords',
        component: ManagePasswordsComponent,
        canActivate: [LoggedUserGuard],
        data: {
          menu: Menu.PASSWORDS
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
