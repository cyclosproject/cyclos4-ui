import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { CovalentStepsModule } from '@covalent/core/steps';
import { CovalentFileModule } from '@covalent/core/file';

import { SatPopoverModule } from '@ncstate/sat-popover';

import { PageLayoutComponent } from 'app/shared/page-layout.component';
import { PageFiltersComponent } from 'app/shared/page-filters.component';
import { PageContentComponent } from 'app/shared/page-content.component';
import { PageHeaderComponent } from 'app/shared/page-header.component';
import { SideMenuComponent } from 'app/shared/side-menu.component';
import { MenuItemComponent } from 'app/shared/menu-item.component';
import { ActionsComponent } from 'app/shared/actions.component';

import { TrustPipe } from 'app/shared/trust.pipe';
import { DatePipe } from 'app/shared/date.pipe';
import { DateTimePipe } from 'app/shared/date-time.pipe';
import { TimePipe } from 'app/shared/time.pipe';
import { NumberPipe } from 'app/shared/number.pipe';
import { CurrencyPipe } from 'app/shared/currency.pipe';
import { AccountPipe } from 'app/shared/account.pipe';
import { MaskDirective } from 'app/shared/mask.directive';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { FocusFirstDirective } from 'app/shared/focus-first.directive';
import { NotificationComponent } from 'app/shared/notification.component';
import { YesNoComponent } from 'app/shared/yes-no.component';
import { ConfirmWithPasswordComponent } from 'app/shared/confirm-with-password.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ViewFormComponent } from 'app/shared/view-form.component';
import { LabelValueComponent } from 'app/shared/label-value.component';
import { AvatarComponent } from 'app/shared/avatar.component';
import { FabSpeedDialComponent } from 'app/shared/fab-speed-dial.component';
import { FabComponent } from 'app/shared/fab.component';
import { TiledResultsComponent } from 'app/shared/tiled-results.component';
import { TiledResultComponent } from 'app/shared/tiled-result.component';
import { PaginatorComponent } from 'app/shared/paginator.component';
import { FormatFieldValueComponent } from 'app/shared/format-field-value.component';
import { CustomFieldValueComponent } from 'app/shared/custom-field-value.component';
import { CustomFieldInputComponent } from 'app/shared/custom-field-input.component';
import { DateFieldComponent } from 'app/shared/date-field.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { PrincipalInputComponent } from 'app/shared/principal-input.component';
import { UserSelectionComponent } from 'app/shared/user-selection.component';
import { FocusedDirective } from 'app/shared/focused.directive';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { ConfirmationPasswordComponent } from 'app/shared/confirmation-password.component';
import { LinearStepperControlComponent } from 'app/shared/linear-stepper-control.component';
import { FieldPrivacyComponent } from 'app/shared/field-privacy.component';
import { CaptchaComponent } from 'app/shared/captcha.component';
import { BreadcrumbComponent } from './breadcrumb.component';
import { ImageViewerComponent } from './image-viewer.component';
import { UserLinkComponent } from './user-link.component';
import { PageTitleComponent } from 'app/shared/page-title.component';


/**
 * Module that configures UI elements
 */
@NgModule({
  declarations: [
    PageLayoutComponent,
    SideMenuComponent,
    MenuItemComponent,
    BreadcrumbComponent,
    PageFiltersComponent,
    PageContentComponent,
    PageHeaderComponent,
    PageTitleComponent,
    ActionsComponent,
    ViewFormComponent,
    LabelValueComponent,
    NotificationComponent,
    YesNoComponent,
    ConfirmWithPasswordComponent,
    DateFieldComponent,
    DecimalFieldComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    CustomFieldInputComponent,
    PrincipalInputComponent,
    PasswordInputComponent,
    FieldPrivacyComponent,
    PaginatorComponent,
    LinearStepperControlComponent,
    ConfirmationPasswordComponent,
    UserSelectionComponent,
    AvatarComponent,
    FabSpeedDialComponent,
    FabComponent,
    TiledResultsComponent,
    TiledResultComponent,
    UserLinkComponent,
    ImageViewerComponent,
    CaptchaComponent,
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
    ReactiveFormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRadioModule,
    MatIconModule,
    MatGridListModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatCardModule,
    MatSidenavModule,
    CovalentStepsModule,
    CovalentFileModule,
    SatPopoverModule
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRadioModule,
    MatIconModule,
    MatGridListModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatCardModule,
    MatSidenavModule,
    CovalentStepsModule,
    CovalentFileModule,
    SatPopoverModule,

    PageLayoutComponent,
    SideMenuComponent,
    MenuItemComponent,
    BreadcrumbComponent,
    PageFiltersComponent,
    PageContentComponent,
    PageHeaderComponent,
    PageTitleComponent,
    ActionsComponent,
    ViewFormComponent,
    LabelValueComponent,
    NotificationComponent,
    YesNoComponent,
    ConfirmWithPasswordComponent,
    DateFieldComponent,
    DecimalFieldComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    CustomFieldInputComponent,
    PrincipalInputComponent,
    PasswordInputComponent,
    FieldPrivacyComponent,
    PaginatorComponent,
    LinearStepperControlComponent,
    ConfirmationPasswordComponent,
    UserSelectionComponent,
    AvatarComponent,
    FabSpeedDialComponent,
    FabComponent,
    TiledResultsComponent,
    TiledResultComponent,
    UserLinkComponent,
    ImageViewerComponent,
    CaptchaComponent,
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
    NotificationComponent,
    YesNoComponent,
    ConfirmWithPasswordComponent
  ]
})
export class SharedModule {
}
