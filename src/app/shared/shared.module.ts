import { NgModule } from '@angular/core';
import { HammerModule } from '@angular/platform-browser';
import { AvatarComponent } from 'app/shared/avatar.component';
import { BooleanPipe } from 'app/shared/boolean.pipe';
import { CountdownButtonComponent } from 'app/shared/countdown-button.component';
import { CurrencyPipe } from 'app/shared/currency.pipe';
import { DateTimePipe } from 'app/shared/date-time.pipe';
import { DatePipe } from 'app/shared/date.pipe';
import { FieldErrorsComponent } from 'app/shared/field-errors.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { MaskDirective } from 'app/shared/mask.directive';
import { NumberPipe } from 'app/shared/number.pipe';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { SharedBasicModule } from 'app/shared/shared-basic.module';
import { TimePipe } from 'app/shared/time.pipe';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

/**
 * Module that configures UI elements shared between all projects
 */
@NgModule({
  declarations: [
    NumbersOnlyDirective,
    MaskDirective,

    AvatarComponent,
    InputFieldComponent,
    FieldErrorsComponent,
    PasswordInputComponent,
    CountdownButtonComponent,

    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    BooleanPipe
  ],
  imports: [SharedBasicModule, HammerModule, BsDropdownModule.forRoot()],
  exports: [
    NumbersOnlyDirective,
    MaskDirective,

    SharedBasicModule,
    BsDropdownModule,

    AvatarComponent,
    InputFieldComponent,
    FieldErrorsComponent,
    PasswordInputComponent,
    CountdownButtonComponent,

    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    BooleanPipe
  ]
})
export class SharedModule {}
