import { NgModule } from '@angular/core';
import { HammerModule } from '@angular/platform-browser';
import { AccountPipe } from 'app/shared/account.pipe';
import { AvatarComponent } from 'app/shared/avatar.component';
import { BasicProfileFieldFilterComponent } from 'app/shared/basic-profile-field-filter.component';
import { BooleanFieldComponent } from 'app/shared/boolean-field.component';
import { BooleanPipe } from 'app/shared/boolean.pipe';
import { ButtonToggleComponent } from 'app/shared/button-toggle.component';
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
import { FieldErrorsComponent } from 'app/shared/field-errors.component';
import { FieldOptionDirective } from 'app/shared/field-option.directive';
import { FileFieldComponent } from 'app/shared/file-field.component';
import { FilesFieldComponent } from 'app/shared/files-field.component';
import { FormatFieldValueComponent } from 'app/shared/format-field-value.component';
import { HiddenTextComponent } from 'app/shared/hidden-text.component';
import { HtmlFieldComponent } from 'app/shared/html-field.component';
import { IconWithCounterComponent } from 'app/shared/icon-with-counter.component';
import { ImagePropertiesDialogComponent } from 'app/shared/image-properties-dialog.component';
import { ImageUploadComponent } from 'app/shared/image-upload.component';
import { ImagesFieldComponent } from 'app/shared/images-field.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { InputListFieldComponent } from 'app/shared/input-list-field.component';
import { InsertImageDialogComponent } from 'app/shared/insert-image-dialog.component';
import { LinkPropertiesDialogComponent } from 'app/shared/link-properties-dialog.component';
import { ManageFilesComponent } from 'app/shared/manage-files.component';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { MaskDirective } from 'app/shared/mask.directive';
import { MultiSelectionFieldComponent } from 'app/shared/multi-selection-field.component';
import { MultipleUsersFieldComponent } from 'app/shared/multiple-users-field.component';
import { NumberPipe } from 'app/shared/number.pipe';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { PickContactComponent } from 'app/shared/pick-contact.component';
import { RadioGroupFieldComponent } from 'app/shared/radio-group-field.component';
import { RichTextContainerComponent } from 'app/shared/rich-text-container.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { SharedBasicModule } from 'app/shared/shared-basic.module';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { TempFileUploadComponent } from 'app/shared/temp-file-upload.component';
import { TextDialogComponent } from 'app/shared/text-dialog.component';
import { TextSelectionFieldComponent } from 'app/shared/text-selection-field.component';
import { TextAreaFieldComponent } from 'app/shared/textarea-field.component';
import { TimeIntervalFieldComponent } from 'app/shared/time-interval-field.component';
import { TimePipe } from 'app/shared/time.pipe';
import { UrlFieldComponent } from 'app/shared/url-field.component';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { RecaptchaFormsModule, RecaptchaModule } from 'ng-recaptcha';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { NgxGalleryModule } from 'ngx-gallery-9';
import { WebcamModule } from 'ngx-webcam';

/**
 * Module that configures UI elements
 */
@NgModule({
  declarations: [
    NumbersOnlyDirective,
    MaskDirective,

    ConfirmationComponent,
    AvatarComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    InputListFieldComponent,
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
    HiddenTextComponent,

    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    BooleanPipe,
    AccountPipe,
  ],
  imports: [
    SharedBasicModule,
    HammerModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    PaginationModule.forRoot(),
    ProgressbarModule.forRoot(),
    SortableModule.forRoot(),
    NgxGalleryModule,
    WebcamModule,
  ],
  exports: [
    SharedBasicModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    PaginationModule,
    ProgressbarModule,
    SortableModule,
    NgxGalleryModule,
    WebcamModule,

    ConfirmationComponent,
    AvatarComponent,
    PasswordInputComponent,
    ConfirmationPasswordComponent,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputFieldComponent,
    InputListFieldComponent,
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
    HiddenTextComponent,

    NumbersOnlyDirective,
    MaskDirective,

    DatePipe,
    DateTimePipe,
    TimePipe,
    NumberPipe,
    CurrencyPipe,
    BooleanPipe,
    AccountPipe,
  ],
  entryComponents: [
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
