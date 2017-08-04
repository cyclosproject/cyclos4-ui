import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { MaterialModule, MdDialog } from '@angular/material'
import { CdkTableModule } from "@angular/cdk";

import { PageComponent } from "app/shared/page.component";
import { ActionsComponent } from "app/shared/actions.component";

import { TrustPipe } from "app/shared/trust.pipe";
import { DatePipe } from "app/shared/date.pipe";
import { DateTimePipe } from "app/shared/date-time.pipe";
import { TimePipe } from "app/shared/time.pipe";
import { NumberPipe } from "app/shared/number.pipe";
import { CurrencyPipe } from "app/shared/currency.pipe";
import { AccountPipe } from "app/shared/account.pipe";
import { FocusFirstDirective } from "app/shared/focus-first.directive";
import { NotificationComponent } from "app/shared/notification.component";
import { NotFoundComponent } from "app/shared/not-found.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ViewFormComponent } from "app/shared/view-form.component";
import { LabelValueComponent } from "app/shared/label-value.component";
import { ResizeEventsComponent } from "app/shared/resize-events.component";
import { AvatarComponent } from "app/shared/avatar.component";

/**
 * Module that configures UI elements
 */
@NgModule({
  declarations: [
    PageComponent,
    ActionsComponent,
    ViewFormComponent,
    LabelValueComponent,
    NotificationComponent,
    AvatarComponent,
    NotFoundComponent,
    ResizeEventsComponent,

    FocusFirstDirective,
    
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
    MaterialModule,
    CdkTableModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    MaterialModule,
    CdkTableModule,

    PageComponent,
    ActionsComponent,
    ViewFormComponent,
    LabelValueComponent,
    NotificationComponent,
    AvatarComponent,
    NotFoundComponent,
    ResizeEventsComponent,

    FocusFirstDirective,

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
