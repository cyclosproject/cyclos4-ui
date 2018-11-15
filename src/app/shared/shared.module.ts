import { AgmCoreModule } from '@agm/core';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { TrustPipe } from 'app/shared/trust.pipe';
import { DatePipe } from 'app/shared/date.pipe';
import { DateTimePipe } from 'app/shared/date-time.pipe';
import { TimePipe } from 'app/shared/time.pipe';
import { NumberPipe } from 'app/shared/number.pipe';
import { AccountPipe } from 'app/shared/account.pipe';
import { CurrencyPipe } from 'app/shared/currency.pipe';
import { IconComponent } from 'app/shared/icon.component';

import { AlertModule } from 'ngx-bootstrap/alert';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule, TooltipConfig } from 'ngx-bootstrap/tooltip';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { LayoutModule } from '@angular/cdk/layout';
import { SpinnerComponent } from 'app/shared/spinner.component';
import { FocusedDirective } from 'app/shared/focused.directive';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { AvatarComponent } from 'app/shared/avatar.component';
import { PageLayoutComponent } from 'app/shared/page-layout.component';
import { PageContentComponent } from 'app/shared/page-content.component';
import { SideMenuComponent } from 'app/shared/side-menu.component';
import { PaginatorComponent } from 'app/shared/paginator.component';
import { LabelValueComponent } from 'app/shared/label-value.component';
import { FormatFieldValueComponent } from 'app/shared/format-field-value.component';
import { CustomFieldValueComponent } from 'app/shared/custom-field-value.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { MaskDirective } from 'app/shared/mask.directive';
import { CustomFieldInputComponent } from 'app/shared/custom-field-input.component';
import { DateFieldComponent } from 'app/shared/date-field.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { BooleanFieldComponent } from 'app/shared/boolean-field.component';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { FieldOptionDirective } from 'app/shared/field-option.directive';
import { MultiSelectionFieldComponent } from 'app/shared/multi-selection-field.component';
import { CheckboxGroupFieldComponent } from 'app/shared/checkbox-group-field.component';
import { RadioGroupFieldComponent } from 'app/shared/radio-group-field.component';
import { TextAreaFieldComponent } from 'app/shared/textarea-field.component';
import { ActionsComponent } from 'app/shared/actions.component';
import { ConfirmationPasswordComponent } from 'app/shared/confirmation-password.component';
import { ExtraCellDirective } from 'app/shared/extra-cell.directive';
import { FieldPrivacyComponent } from 'app/shared/field-privacy.component';
import { FieldErrorsComponent } from 'app/shared/field-errors.component';
import { NotificationComponent } from 'app/shared/notification.component';
import { ImageUploadComponent } from 'app/shared/image-upload.component';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { FileUploadComponent } from 'app/shared/file-upload.component';
import { ManageFilesComponent } from 'app/shared/manage-files.component';
import { FilesFieldComponent } from 'app/shared/files-field.component';
import { ImagesFieldComponent } from 'app/shared/images-field.component';
import { ResultTypeFieldComponent } from 'app/shared/result-type-field.component';
import { ResultsLayoutComponent } from 'app/shared/results-layout.component';
import { ResultCategoryDirective } from 'app/shared/result-category.directive';
import { ResultTableDirective } from 'app/shared/result-table.directive';
import { ResultTileDirective } from 'app/shared/result-tile.directive';
import { ResultInfoWindowDirective } from 'app/shared/result-info-window.directive';
import { AddressDetailsComponent } from 'app/shared/address-details.component';
import { UserLinkComponent } from 'app/shared/user-link.component';
import { ContentMonitorComponent } from 'app/shared/content-monitor.component';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { ChipComponent } from 'app/shared/chip.component';
import { PickContactComponent } from 'app/shared/pick-contact.component';
import { CustomFieldFilterComponent } from 'app/shared/custom-field-filter.component';
import { CaptchaComponent } from 'app/shared/captcha.component';
import { ConfirmationComponent } from 'app/shared/confirmation.component';
import { MaybeLinkComponent } from 'app/shared/maybe-link.component';
import { StaticMapComponent } from 'app/shared/static-map.component';


export function initTooltipConfig(): TooltipConfig {
  const config = new TooltipConfig();
  config.placement = 'bottom';
  config.container = 'body';
  return config;
}

/**
 * Module that configures UI elements
 */
@NgModule({
  declarations: [
    FocusedDirective,
    NumbersOnlyDirective,
    MaskDirective,

    NotFoundComponent,
    NotificationComponent,
    ConfirmationComponent,
    SideMenuComponent,
    IconComponent,
    MaybeLinkComponent,
    AvatarComponent,
    SpinnerComponent,
    PageLayoutComponent,
    PageContentComponent,
    ResultsLayoutComponent,
    StaticMapComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    ActionsComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    PaginatorComponent,
    LabelValueComponent,
    ExtraCellDirective,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    TextAreaFieldComponent,
    FieldErrorsComponent,
    FieldOptionDirective,
    SingleSelectionFieldComponent,
    MultiSelectionFieldComponent,
    CheckboxGroupFieldComponent,
    RadioGroupFieldComponent,
    DateFieldComponent,
    DecimalFieldComponent,
    CustomFieldInputComponent,
    CustomFieldFilterComponent,
    FieldPrivacyComponent,
    ImagesFieldComponent,
    ImageUploadComponent,
    ManageImagesComponent,
    FilesFieldComponent,
    FileUploadComponent,
    ManageFilesComponent,
    ResultTypeFieldComponent,
    AddressDetailsComponent,
    UserLinkComponent,
    UserFieldComponent,
    PickContactComponent,
    ContentMonitorComponent,
    ChipComponent,
    CaptchaComponent,

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
    AlertModule.forRoot(),
    ModalModule.forRoot(),
    ButtonsModule.forRoot(),
    BsDropdownModule.forRoot(),
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot(),
    SortableModule.forRoot(),
    TooltipModule.forRoot(),
    BsDatepickerModule.forRoot(),

    LayoutModule,

    AgmCoreModule
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,

    AlertModule,
    ModalModule,
    ButtonsModule,
    BsDropdownModule,
    PaginationModule,
    ProgressbarModule,
    SortableModule,
    TooltipModule,
    BsDatepickerModule,

    LayoutModule,

    AgmCoreModule,

    NotFoundComponent,
    NotificationComponent,
    ConfirmationComponent,
    SideMenuComponent,
    IconComponent,
    MaybeLinkComponent,
    AvatarComponent,
    SpinnerComponent,
    PageLayoutComponent,
    PageContentComponent,
    ResultsLayoutComponent,
    StaticMapComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    ActionsComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    PaginatorComponent,
    LabelValueComponent,
    ExtraCellDirective,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    TextAreaFieldComponent,
    FieldErrorsComponent,
    FieldOptionDirective,
    SingleSelectionFieldComponent,
    MultiSelectionFieldComponent,
    CheckboxGroupFieldComponent,
    RadioGroupFieldComponent,
    DateFieldComponent,
    DecimalFieldComponent,
    CustomFieldInputComponent,
    CustomFieldFilterComponent,
    FieldPrivacyComponent,
    ImagesFieldComponent,
    ImageUploadComponent,
    ManageImagesComponent,
    FilesFieldComponent,
    FileUploadComponent,
    ManageFilesComponent,
    ResultTypeFieldComponent,
    AddressDetailsComponent,
    UserLinkComponent,
    UserFieldComponent,
    PickContactComponent,
    ContentMonitorComponent,
    ChipComponent,
    CaptchaComponent,

    FocusedDirective,
    NumbersOnlyDirective,
    MaskDirective,

    TrustPipe,
    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    AccountPipe
  ],
  providers: [
    { provide: TooltipConfig, useFactory: initTooltipConfig },
  ],
  entryComponents: [
    NotificationComponent,
    ConfirmationComponent,
    ManageImagesComponent,
    ManageFilesComponent,
    PickContactComponent
  ]
})
export class SharedModule {
}
