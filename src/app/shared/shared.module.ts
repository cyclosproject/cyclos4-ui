import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { MaterialModule, MdDialog } from '@angular/material'

import { SectionComponent } from "app/shared/section.component";
import { ActionsComponent } from "app/shared/actions.component";

import { TrustPipe } from "app/shared/trust.pipe";
import { DatePipe } from "app/shared/date.pipe";
import { DateTimePipe } from "app/shared/date-time.pipe";
import { TimePipe } from "app/shared/time.pipe";
import { NumberPipe } from "app/shared/number.pipe";
import { CurrencyPipe } from "app/shared/currency.pipe";
import { AccountPipe } from "app/shared/account.pipe";
import { MaskDirective } from "app/shared/mask.directive";
import { NumbersOnlyDirective } from "app/shared/numbers-only.directive";
import { FocusFirstDirective } from "app/shared/focus-first.directive";
import { NotificationComponent } from "app/shared/notification.component";
import { NotFoundComponent } from "app/shared/not-found.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ViewFormComponent } from "app/shared/view-form.component";
import { LabelValueComponent } from "app/shared/label-value.component";
import { AvatarComponent } from "app/shared/avatar.component";
import { CustomFieldValueComponent } from "app/shared/custom-field-value.component";
import { CustomFieldInputComponent } from "app/shared/custom-field-input.component";
import { DateFieldComponent } from "app/shared/date-field.component";
import { DecimalFieldComponent } from "app/shared/decimal-field.component";
import { PrincipalInputComponent } from "app/shared/principal-input.component";
import { UserSelectionComponent } from "app/shared/user-selection.component";
import { FocusedDirective } from "app/shared/focused.directive";
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { ConfirmationPasswordComponent } from 'app/shared/confirmation-password.component';

/**
 * Module that configures UI elements
 */
@NgModule({
  declarations: [
    SectionComponent,
    ActionsComponent,
    ViewFormComponent,
    LabelValueComponent,
    NotificationComponent,
    DateFieldComponent,
    DecimalFieldComponent,
    CustomFieldValueComponent,
    CustomFieldInputComponent,
    PrincipalInputComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    UserSelectionComponent,
    AvatarComponent,
    NotFoundComponent,

    FocusFirstDirective,
    FocusedDirective,
    MaskDirective,
    NumbersOnlyDirective,

    TrustPipe,
    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    AccountPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    MaterialModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    MaterialModule,

    SectionComponent,
    ActionsComponent,
    ViewFormComponent,
    LabelValueComponent,
    NotificationComponent,
    DateFieldComponent,
    DecimalFieldComponent,
    CustomFieldValueComponent,
    CustomFieldInputComponent,
    PrincipalInputComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    UserSelectionComponent,
    AvatarComponent,
    NotFoundComponent,

    FocusFirstDirective,
    FocusedDirective,
    MaskDirective,
    NumbersOnlyDirective,

    TrustPipe,
    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    AccountPipe
  ],
  entryComponents: [
    NotificationComponent
  ]
})
export class SharedModule {
}
