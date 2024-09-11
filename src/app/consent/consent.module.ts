import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ConsentFormComponent } from 'app/consent/consent-form.component';
import { ConsentRoutingModule } from 'app/consent/consent-routing.module';
import { ConsentState } from 'app/consent/consent-state';
import { ConsentComponent } from 'app/consent/consent.component';
import { OidcService } from 'app/consent/oidc.service';
import { CoreBasicModule } from 'app/core/core-basic.module';
import { CountdownButtonComponent } from 'app/shared/countdown-button.component';
import { FieldErrorsComponent } from 'app/shared/field-errors.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { MaskDirective } from 'app/shared/mask.directive';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { PasswordInputComponent } from 'app/shared/password-input.component';
@NgModule({
  declarations: [
    ConsentComponent,
    ConsentFormComponent,
    PasswordInputComponent,
    InputFieldComponent,
    FieldErrorsComponent,
    MaskDirective,
    NumbersOnlyDirective,
    CountdownButtonComponent
  ],
  imports: [BrowserModule, ConsentRoutingModule, HttpClientModule, CoreBasicModule],
  providers: [OidcService, ConsentState],
  bootstrap: [ConsentComponent]
})
export class ConsentModule {}
