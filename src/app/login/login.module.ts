import { NgModule } from '@angular/core';
import { AcceptPendingAgreementsComponent } from 'app/login/accept-pending-agreements.component';
import { ChangeExpiredPasswordComponent } from 'app/login/change-expired-password.component';
import { ChangeForgottenPasswordComponent } from 'app/login/change-forgotten-password.component';
import { ForgotPasswordStepChangeComponent } from 'app/login/forgot-password-step-change.component';
import { ForgotPasswordStepCodeComponent } from 'app/login/forgot-password-step-code.component';
import { ForgotPasswordStepRequestComponent } from 'app/login/forgot-password-step-request.component';
import { ForgotPasswordComponent } from 'app/login/forgot-password.component';
import { LoginComponent } from 'app/login/login.component';
import { RegistrationAgreementsComponent } from 'app/login/registration-agreements.component';
import { SharedModule } from 'app/shared/shared.module';


/**
 * Module comprising the login functionality
 */
@NgModule({
  declarations: [
    LoginComponent,
    ForgotPasswordComponent,
    ForgotPasswordStepRequestComponent,
    ForgotPasswordStepCodeComponent,
    ForgotPasswordStepChangeComponent,
    ChangeForgottenPasswordComponent,
    ChangeExpiredPasswordComponent,
    AcceptPendingAgreementsComponent,
    RegistrationAgreementsComponent
  ],
  imports: [
    SharedModule
  ],
  entryComponents: [
    RegistrationAgreementsComponent
  ]
})
export class LoginModule { }
