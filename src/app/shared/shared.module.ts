import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";

import {
  MatButtonModule, MatInputModule, MatCheckboxModule, MatRadioModule,
  MatSelectModule, MatDatepickerModule, MatTooltipModule,
  MatIconModule, MatGridListModule, MatTabsModule, MatTableModule,
  MatDialog, MatDialogModule, MatCardModule,
  MatSidenavModule, MatStepperModule
} from '@angular/material'

import { PageLayoutComponent } from "app/shared/page-layout.component";
import { PageFiltersComponent } from "app/shared/page-filters.component";
import { PageContentComponent } from "app/shared/page-content.component";
import { PageHeaderComponent } from "app/shared/page-header.component";
import { SideMenuComponent } from "app/shared/side-menu.component";
import { MenuItemComponent } from 'app/shared/menu-item.component';
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
import { PaginatorComponent } from "app/shared/paginator.component";
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
    PageLayoutComponent,
    SideMenuComponent,
    MenuItemComponent,
    PageFiltersComponent,
    PageContentComponent,
    PageHeaderComponent,
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
    PaginatorComponent,
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
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatInputModule, 
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatRadioModule,
    MatIconModule,
    MatGridListModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatCardModule,
    MatSidenavModule,
    MatStepperModule
  ],
  exports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatInputModule, 
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatRadioModule,
    MatIconModule,
    MatGridListModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatCardModule,
    MatSidenavModule,
    MatStepperModule,

    PageLayoutComponent,
    SideMenuComponent,
    MenuItemComponent,
    PageFiltersComponent,
    PageContentComponent,
    PageHeaderComponent,
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
    PaginatorComponent,
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
