import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Menu } from 'app/shared/menu';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { ManagePasswordsComponent } from 'app/personal/passwords/manage-passwords.component';

const personalRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'passwords',
        canActivate: [LoggedUserGuard],
        component: ManagePasswordsComponent,
        data: {
          menu: Menu.PASSWORDS
        }
      }
    ]
  }
];

/**
 * Routes for the personal module
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
