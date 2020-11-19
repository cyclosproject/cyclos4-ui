import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HammerModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { AccountPipe } from 'app/shared/account.pipe';
import { ActionButtonComponent } from 'app/shared/action-button.component';
import { ActionsComponent } from 'app/shared/actions.component';
import { AvatarComponent } from 'app/shared/avatar.component';
import { BasicProfileFieldFilterComponent } from 'app/shared/basic-profile-field-filter.component';
import { BooleanFieldComponent } from 'app/shared/boolean-field.component';
import { BooleanPipe } from 'app/shared/boolean.pipe';
import { ButtonToggleComponent } from 'app/shared/button-toggle.component';
import { CalendarComponent } from 'app/shared/calendar.component';
import { CaptchaComponent } from 'app/shared/captcha.component';
import { CaptureCameraComponent } from 'app/shared/capture-camera.component';
import { CheckboxGroupFieldComponent } from 'app/shared/checkbox-group-field.component';
import { ChipComponent } from 'app/shared/chip.component';
import { ConfirmationPasswordComponent } from 'app/shared/confirmation-password.component';
import { ConfirmationComponent } from 'app/shared/confirmation.component';
import { ContentMonitorComponent } from 'app/shared/content-monitor.component';
import { CountdownButtonComponent } from 'app/shared/countdown-button.component';
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
import { FileFieldComponent } from 'app/shared/file-field.component';
import { FilesFieldComponent } from 'app/shared/files-field.component';
import { FocusedDirective } from 'app/shared/focused.directive';
import { FormatFieldValueComponent } from 'app/shared/format-field-value.component';
import { HtmlFieldComponent } from 'app/shared/html-field.component';
import { IconWithCounterComponent } from 'app/shared/icon-with-counter.component';
import { IconComponent } from 'app/shared/icon.component';
import { ImagePropertiesDialogComponent } from 'app/shared/image-properties-dialog.component';
import { ImageUploadComponent } from 'app/shared/image-upload.component';
import { ImagesFieldComponent } from 'app/shared/images-field.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { InsertImageDialogComponent } from 'app/shared/insert-image-dialog.component';
import { LabelValueComponent } from 'app/shared/label-value.component';
import { LinkPropertiesDialogComponent } from 'app/shared/link-properties-dialog.component';
import { ManageFilesComponent } from 'app/shared/manage-files.component';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { MaskDirective } from 'app/shared/mask.directive';
import { MaybeLinkComponent } from 'app/shared/maybe-link.component';
import { MultiSelectionFieldComponent } from 'app/shared/multi-selection-field.component';
import { MultipleUsersFieldComponent } from 'app/shared/multiple-users-field.component';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { NotificationComponent } from 'app/shared/notification.component';
import { NumberPipe } from 'app/shared/number.pipe';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { PickContactComponent } from 'app/shared/pick-contact.component';
import { RadioGroupFieldComponent } from 'app/shared/radio-group-field.component';
import { RichTextContainerComponent } from 'app/shared/rich-text-container.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { SpinnerComponent } from 'app/shared/spinner.component';
import { TempFileUploadComponent } from 'app/shared/temp-file-upload.component';
import { TextDialogComponent } from 'app/shared/text-dialog.component';
import { TextSelectionFieldComponent } from 'app/shared/text-selection-field.component';
import { TextAreaFieldComponent } from 'app/shared/textarea-field.component';
import { TimeIntervalFieldComponent } from 'app/shared/time-interval-field.component';
import { TimePipe } from 'app/shared/time.pipe';
import { TrustPipe } from 'app/shared/trust.pipe';
import { UrlFieldComponent } from 'app/shared/url-field.component';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { TooltipConfig, TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgxGalleryModule } from 'ngx-gallery-9';
import { WebcamModule } from 'ngx-webcam';


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
    IconComponent,
    MaybeLinkComponent,
    AvatarComponent,
    SpinnerComponent,
    ActionsComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    LabelValueComponent,
    ExtraCellDirective,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    HtmlFieldComponent,
    InsertImageDialogComponent,
    ImagePropertiesDialogComponent,
    LinkPropertiesDialogComponent,
    UrlFieldComponent,
    TextAreaFieldComponent,
    TextDialogComponent,
    FieldErrorsComponent,
    FieldOptionDirective,
    SingleSelectionFieldComponent,
    MultiSelectionFieldComponent,
    CheckboxGroupFieldComponent,
    RadioGroupFieldComponent,
    CalendarComponent,
    DateFieldComponent,
    TimeIntervalFieldComponent,
    DecimalFieldComponent,
    CustomFieldInputComponent,
    CustomFieldFilterComponent,
    BasicProfileFieldFilterComponent,
    ImagesFieldComponent,
    ImageUploadComponent,
    ManageImagesComponent,
    FileFieldComponent,
    FilesFieldComponent,
    TempFileUploadComponent,
    ManageFilesComponent,
    UserFieldComponent,
    MultipleUsersFieldComponent,
    TextSelectionFieldComponent,
    PickContactComponent,
    ContentMonitorComponent,
    ChipComponent,
    CaptchaComponent,
    ScanQrCodeComponent,
    CaptureCameraComponent,
    IconWithCounterComponent,
    ButtonToggleComponent,
    CountdownButtonComponent,
    ActionButtonComponent,

    TrustPipe,
    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    BooleanPipe,
    AccountPipe,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    HammerModule,
    AlertModule.forRoot(),
    ModalModule.forRoot(),
    ButtonsModule.forRoot(),
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot(),
    SortableModule.forRoot(),
    TooltipModule.forRoot(),
    BsDropdownModule.forRoot(),
    NgxGalleryModule,
    ZXingScannerModule,
    WebcamModule,

    LayoutModule,
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,

    AlertModule,
    ModalModule,
    ButtonsModule,
    PaginationModule,
    ProgressbarModule,
    SortableModule,
    TooltipModule,
    BsDropdownModule,
    NgxGalleryModule,
    ZXingScannerModule,
    WebcamModule,

    LayoutModule,

    NotFoundComponent,
    NotificationComponent,
    ConfirmationComponent,
    IconComponent,
    MaybeLinkComponent,
    AvatarComponent,
    SpinnerComponent,
    ActionsComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    LabelValueComponent,
    ExtraCellDirective,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    HtmlFieldComponent,
    InsertImageDialogComponent,
    ImagePropertiesDialogComponent,
    LinkPropertiesDialogComponent,
    UrlFieldComponent,
    TextAreaFieldComponent,
    FieldErrorsComponent,
    FieldOptionDirective,
    SingleSelectionFieldComponent,
    MultiSelectionFieldComponent,
    CheckboxGroupFieldComponent,
    RadioGroupFieldComponent,
    CalendarComponent,
    DateFieldComponent,
    TimeIntervalFieldComponent,
    DecimalFieldComponent,
    CustomFieldInputComponent,
    CustomFieldFilterComponent,
    BasicProfileFieldFilterComponent,
    ImagesFieldComponent,
    ImageUploadComponent,
    ManageImagesComponent,
    FileFieldComponent,
    FilesFieldComponent,
    TempFileUploadComponent,
    ManageFilesComponent,
    UserFieldComponent,
    MultipleUsersFieldComponent,
    TextSelectionFieldComponent,
    PickContactComponent,
    ContentMonitorComponent,
    ChipComponent,
    CaptchaComponent,
    ScanQrCodeComponent,
    CaptureCameraComponent,
    IconWithCounterComponent,

    ButtonToggleComponent,
    CountdownButtonComponent,
    ActionButtonComponent,

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
    AccountPipe,
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
    InsertImageDialogComponent,
    ImagePropertiesDialogComponent,
    LinkPropertiesDialogComponent,
    TextDialogComponent,
    ScanQrCodeComponent,
    CaptureCameraComponent
  ],
})
export class SharedModule {
}
