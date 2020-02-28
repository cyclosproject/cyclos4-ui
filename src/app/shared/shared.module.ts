import { AgmCoreModule } from '@agm/core';
import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxGalleryModule } from 'ngx-gallery';
import { AccountPipe } from 'app/shared/account.pipe';
import { ActionsComponent } from 'app/shared/actions.component';
import { AddressDetailsComponent } from 'app/shared/address-details.component';
import { AddressFormComponent } from 'app/shared/address-form.component';
import { AvatarComponent } from 'app/shared/avatar.component';
import { BannerCardComponent } from 'app/shared/banner-card.component';
import { BooleanFieldComponent } from 'app/shared/boolean-field.component';
import { BooleanPipe } from 'app/shared/boolean.pipe';
import { ButtonToggleComponent } from 'app/shared/button-toggle.component';
import { CalendarComponent } from 'app/shared/calendar.component';
import { CaptchaComponent } from 'app/shared/captcha.component';
import { CheckboxGroupFieldComponent } from 'app/shared/checkbox-group-field.component';
import { ChipComponent } from 'app/shared/chip.component';
import { ConfirmationPasswordComponent } from 'app/shared/confirmation-password.component';
import { ConfirmationComponent } from 'app/shared/confirmation.component';
import { ContentMonitorComponent } from 'app/shared/content-monitor.component';
import { CurrencyPipe } from 'app/shared/currency.pipe';
import { CustomFieldFilterComponent } from 'app/shared/custom-field-filter.component';
import { CustomFieldInputComponent } from 'app/shared/custom-field-input.component';
import { CustomFieldValueComponent } from 'app/shared/custom-field-value.component';
import { DateFieldComponent } from 'app/shared/date-field.component';
import { DateTimePipe } from 'app/shared/date-time.pipe';
import { DatePipe } from 'app/shared/date.pipe';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { ExtraCellDirective } from 'app/shared/extra-cell.directive';
import { FieldErrorsComponent } from 'app/shared/field-errors.component';
import { FieldOptionDirective } from 'app/shared/field-option.directive';
import { FieldPrivacyComponent } from 'app/shared/field-privacy.component';
import { FileFieldComponent } from 'app/shared/file-field.component';
import { FilesFieldComponent } from 'app/shared/files-field.component';
import { FocusedDirective } from 'app/shared/focused.directive';
import { FormatFieldValueComponent } from 'app/shared/format-field-value.component';
import { HeadingActionsComponent } from 'app/shared/heading-actions.component';
import { IconWithCounterComponent } from 'app/shared/icon-with-counter.component';
import { IconComponent } from 'app/shared/icon.component';
import { ImageUploadComponent } from 'app/shared/image-upload.component';
import { ImagesFieldComponent } from 'app/shared/images-field.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { UrlFieldComponent } from 'app/shared/url-field.component';
import { LabelValueComponent } from 'app/shared/label-value.component';
import { ManageFilesComponent } from 'app/shared/manage-files.component';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { MapResultComponent } from 'app/shared/map-result.component';
import { MaskDirective } from 'app/shared/mask.directive';
import { MaxDistanceFieldComponent } from 'app/shared/max-distance-field.component';
import { MaybeLinkComponent } from 'app/shared/maybe-link.component';
import { MobileResultComponent } from 'app/shared/mobile-result.component';
import { MobileResultDirective } from 'app/shared/mobile-result.directive';
import { MultiSelectionFieldComponent } from 'app/shared/multi-selection-field.component';
import { MultipleUsersFieldComponent } from 'app/shared/multiple-users-field.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { NotificationComponent } from 'app/shared/notification.component';
import { NumberPipe } from 'app/shared/number.pipe';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { PageContentComponent } from 'app/shared/page-content.component';
import { PageLayoutComponent } from 'app/shared/page-layout.component';
import { PaginatorComponent } from 'app/shared/paginator.component';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { PickContactComponent } from 'app/shared/pick-contact.component';
import { ProfileAddressesComponent } from 'app/shared/profile-addresses.component';
import { RadioGroupFieldComponent } from 'app/shared/radio-group-field.component';
import { ResultCategoryDirective } from 'app/shared/result-category.directive';
import { ResultInfoWindowDirective } from 'app/shared/result-info-window.directive';
import { ResultTableDirective } from 'app/shared/result-table.directive';
import { ResultTileDirective } from 'app/shared/result-tile.directive';
import { ResultTypeFieldComponent } from 'app/shared/result-type-field.component';
import { ResultsLayoutComponent } from 'app/shared/results-layout.component';
import { RichTextContainerComponent } from 'app/shared/rich-text-container.component';
import { ShowContentComponent } from 'app/shared/show-content.component';
import { SideMenuComponent } from 'app/shared/side-menu.component';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { SpinnerComponent } from 'app/shared/spinner.component';
import { StaticMapComponent } from 'app/shared/static-map.component';
import { TempFileUploadComponent } from 'app/shared/temp-file-upload.component';
import { TextDialogComponent } from 'app/shared/text-dialog.component';
import { TextAreaFieldComponent } from 'app/shared/textarea-field.component';
import { TiledResultComponent } from 'app/shared/tiled-result.component';
import { TimeIntervalFieldComponent } from 'app/shared/time-interval-field.component';
import { TimePipe } from 'app/shared/time.pipe';
import { TrustPipe } from 'app/shared/trust.pipe';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { UserInfoComponent } from 'app/shared/user-info.component';
import { UserLinkComponent } from 'app/shared/user-link.component';
import { NotificationTypeSettingComponent } from 'app/users/notification-settings/notification-type-setting.component';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { TooltipConfig, TooltipModule } from 'ngx-bootstrap/tooltip';
import { ProfileImagesComponent } from 'app/shared/profile-images.component';
import { TextSelectionFieldComponent } from 'app/shared/text-selection-field.component';
import { ActionsToolbarComponent } from 'app/shared/actions-toolbar.component';


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
    HeadingActionsComponent,
    ActionsToolbarComponent,
    BannerCardComponent,
    ShowContentComponent,
    ResultsLayoutComponent,
    TiledResultComponent,
    MapResultComponent,
    MobileResultComponent,
    StaticMapComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    MobileResultDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    ActionsComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    PaginatorComponent,
    LabelValueComponent,
    ExtraCellDirective,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    UrlFieldComponent,
    TextAreaFieldComponent,
    TextDialogComponent,
    FieldErrorsComponent,
    FieldOptionDirective,
    SingleSelectionFieldComponent,
    MultiSelectionFieldComponent,
    CheckboxGroupFieldComponent,
    RadioGroupFieldComponent,
    AddressFormComponent,
    CalendarComponent,
    DateFieldComponent,
    TimeIntervalFieldComponent,
    DecimalFieldComponent,
    CustomFieldInputComponent,
    CustomFieldFilterComponent,
    FieldPrivacyComponent,
    MaxDistanceFieldComponent,
    ImagesFieldComponent,
    ImageUploadComponent,
    ManageImagesComponent,
    FileFieldComponent,
    FilesFieldComponent,
    TempFileUploadComponent,
    ManageFilesComponent,
    ResultTypeFieldComponent,
    AddressDetailsComponent,
    ProfileAddressesComponent,
    ProfileImagesComponent,
    UserLinkComponent,
    UserInfoComponent,
    UserFieldComponent,
    MultipleUsersFieldComponent,
    TextSelectionFieldComponent,
    PickContactComponent,
    ContentMonitorComponent,
    ChipComponent,
    CaptchaComponent,
    IconWithCounterComponent,
    ButtonToggleComponent,
    NotificationTypeSettingComponent,

    TrustPipe,
    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    BooleanPipe,
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
    NgxGalleryModule,

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
    NgxGalleryModule,

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
    HeadingActionsComponent,
    ActionsToolbarComponent,
    BannerCardComponent,
    ShowContentComponent,
    ResultsLayoutComponent,
    TiledResultComponent,
    MapResultComponent,
    MobileResultComponent,
    StaticMapComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    MobileResultDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    ActionsComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    PaginatorComponent,
    LabelValueComponent,
    ExtraCellDirective,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    UrlFieldComponent,
    TextAreaFieldComponent,
    FieldErrorsComponent,
    FieldOptionDirective,
    SingleSelectionFieldComponent,
    MultiSelectionFieldComponent,
    CheckboxGroupFieldComponent,
    RadioGroupFieldComponent,
    AddressFormComponent,
    CalendarComponent,
    DateFieldComponent,
    TimeIntervalFieldComponent,
    DecimalFieldComponent,
    CustomFieldInputComponent,
    CustomFieldFilterComponent,
    FieldPrivacyComponent,
    MaxDistanceFieldComponent,
    ImagesFieldComponent,
    ImageUploadComponent,
    ManageImagesComponent,
    FileFieldComponent,
    FilesFieldComponent,
    TempFileUploadComponent,
    ManageFilesComponent,
    ResultTypeFieldComponent,
    AddressDetailsComponent,
    ProfileAddressesComponent,
    ProfileImagesComponent,
    UserLinkComponent,
    UserInfoComponent,
    UserFieldComponent,
    MultipleUsersFieldComponent,
    TextSelectionFieldComponent,
    PickContactComponent,
    ContentMonitorComponent,
    ChipComponent,
    CaptchaComponent,
    IconWithCounterComponent,
    ButtonToggleComponent,
    NotificationTypeSettingComponent,

    FocusedDirective,
    NumbersOnlyDirective,
    MaskDirective,

    TrustPipe,
    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    BooleanPipe,
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
    PickContactComponent,
    TextDialogComponent,
  ]
})
export class SharedModule {
}
