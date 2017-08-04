import { NgModule } from '@angular/core';

import { LoginComponent } from './login.component';
import { SharedModule } from "app/shared/shared.module";
import { LoginFormComponent } from "app/login/login-form.component";

/**
 * Module comprising the login functionality
 */
@NgModule({
  declarations: [
    LoginComponent,
    LoginFormComponent
  ],
  imports: [
    SharedModule
  ]
})
export class LoginModule { }