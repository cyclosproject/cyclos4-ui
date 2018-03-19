import { NgModule } from '@angular/core';

import { LoginComponent } from './login.component';
import { SharedModule } from 'app/shared/shared.module';
import { ForgotPasswordComponent } from './forgot-password.component';

/**
 * Module comprising the login functionality
 */
@NgModule({
  declarations: [
    LoginComponent,
    ForgotPasswordComponent
  ],
  imports: [
    SharedModule
  ]
})
export class LoginModule { }
