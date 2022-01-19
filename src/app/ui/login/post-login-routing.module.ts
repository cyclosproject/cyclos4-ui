import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedUserGuard } from 'app/ui/logged-user-guard';
import { AcceptPendingAgreementsComponent } from 'app/ui/login/accept-pending-agreements.component';
import { ChangeExpiredPasswordComponent } from 'app/ui/login/change-expired-password.component';
import { ForgotPasswordComponent } from 'app/ui/login/forgot-password.component';
import { LoginConfirmationComponent } from 'app/ui/login/login-confirmation.component';

const postLoginRouters: Routes = [
  {
    path: '',
    children: [
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },
      {
        path: 'login-confirmation',
        canActivate: [LoggedUserGuard],
        component: LoginConfirmationComponent
      },
      {
        path: 'pending-agreements',
        canActivate: [LoggedUserGuard],
        component: AcceptPendingAgreementsComponent,
      },
      {
        path: 'expired-password',
        canActivate: [LoggedUserGuard],
        component: ChangeExpiredPasswordComponent,
      },
    ],
  },
];

/**
 * * Routes for the post-login module
 */
@NgModule({
  imports: [
    RouterModule.forChild(postLoginRouters),
  ],
  exports: [
    RouterModule,
  ],
})
export class PostLoginRoutingModule {
}
