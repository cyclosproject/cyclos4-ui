import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersMessagesResolve } from 'app/users/users-messages.resolve';
import { LoggedUserGuard } from 'app/logged-user-guard';
import { Menu } from 'app/shared/menu';
import { RegistrationGroupsResolve } from 'app/registration-groups.resolve';
import { PublicRegistrationComponent } from 'app/users/registration/public-registration.component';

const usersRoutes: Routes = [
  {
    path: '',
    resolve: {
      usersMessages: UsersMessagesResolve
    },
    children: [
      {
        path: 'registration',
        component: PublicRegistrationComponent,
        resolve: {
          groups: RegistrationGroupsResolve
        },
        data: {
          menu: Menu.REGISTRATION
        }
      }
    ]
  }
];

/**
 * * Routes for the users module
 */
@NgModule({
  imports: [
    RouterModule.forChild(usersRoutes)
  ],
  exports: [
    RouterModule
  ],
  providers: [
    UsersMessagesResolve
  ]
})
export class UsersRoutingModule {}
