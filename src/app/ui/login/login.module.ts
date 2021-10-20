import { NgModule } from '@angular/core';
import { AcceptPendingAgreementsComponent } from 'app/ui/login/accept-pending-agreements.component';
import { ChangeExpiredPasswordComponent } from 'app/ui/login/change-expired-password.component';
import { ChangeForgottenPasswordComponent } from 'app/ui/login/change-forgotten-password.component';
import { ForgotPasswordStepChangeComponent } from 'app/ui/login/forgot-password-step-change.component';
import { ForgotPasswordStepCodeComponent } from 'app/ui/login/forgot-password-step-code.component';
import { ForgotPasswordStepRequestComponent } from 'app/ui/login/forgot-password-step-request.component';
import { ForgotPasswordComponent } from 'app/ui/login/forgot-password.component';
import { LoginConfirmationComponent } from 'app/ui/login/login-confirmation.component';
import { LoginComponent } from 'app/ui/login/login.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Module comprising the login functionality
 */
@NgModule({
  declarations: [
    LoginComponent,
    LoginConfirmationComponent,
    ForgotPasswordComponent,
    ForgotPasswordStepRequestComponent,
    ForgotPasswordStepCodeComponent,
    ForgotPasswordStepChangeComponent,
    ChangeForgottenPasswordComponent,
    ChangeExpiredPasswordComponent,
    AcceptPendingAgreementsComponent,
  ],
  imports: [
    UiSharedModule,
  ],
})
export class LoginModule { }
