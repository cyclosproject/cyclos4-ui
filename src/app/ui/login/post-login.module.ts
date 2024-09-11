import { NgModule } from '@angular/core';
import { AcceptPendingAgreementsComponent } from 'app/ui/login/accept-pending-agreements.component';
import { ChangeExpiredPasswordComponent } from 'app/ui/login/change-expired-password.component';
import { ForgotPasswordStepChangeComponent } from 'app/ui/login/forgot-password-step-change.component';
import { ForgotPasswordStepCodeComponent } from 'app/ui/login/forgot-password-step-code.component';
import { ForgotPasswordStepRequestComponent } from 'app/ui/login/forgot-password-step-request.component';
import { ForgotPasswordComponent } from 'app/ui/login/forgot-password.component';
import { LoginConfirmationComponent } from 'app/ui/login/login-confirmation.component';
import { PostLoginRoutingModule } from 'app/ui/login/post-login-routing.module';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Module comprising the login functionality
 */
@NgModule({
  declarations: [
    LoginConfirmationComponent,
    ForgotPasswordComponent,
    ForgotPasswordStepRequestComponent,
    ForgotPasswordStepCodeComponent,
    ForgotPasswordStepChangeComponent,
    ChangeExpiredPasswordComponent,
    AcceptPendingAgreementsComponent
  ],
  imports: [PostLoginRoutingModule, UiSharedModule]
})
export class PostLoginModule {}
