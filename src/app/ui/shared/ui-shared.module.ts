import { NgModule } from '@angular/core';
import { ConfirmationService, ConfirmOptions } from 'app/core/confirmation.service';
import { BasicProfileFieldFilterComponent } from 'app/shared/basic-profile-field-filter.component';
import { BooleanFieldComponent } from 'app/shared/boolean-field.component';
import { ButtonToggleComponent } from 'app/shared/button-toggle.component';
import { CaptchaComponent } from 'app/shared/captcha.component';
import { CaptureCameraComponent } from 'app/shared/capture-camera.component';
import { CheckboxGroupFieldComponent } from 'app/shared/checkbox-group-field.component';
import { ChipComponent } from 'app/shared/chip.component';
import { ConfirmationPasswordComponent } from 'app/shared/confirmation-password.component';
import { ConfirmationComponent } from 'app/shared/confirmation.component';
import { ContentMonitorComponent } from 'app/shared/content-monitor.component';
import { CustomFieldFilterComponent } from 'app/shared/custom-field-filter.component';
import { CustomFieldInputComponent } from 'app/shared/custom-field-input.component';
import { CustomFieldValueComponent } from 'app/shared/custom-field-value.component';
import { DateFieldComponent } from 'app/shared/date-field.component';
import { DecimalFieldComponent } from 'app/shared/decimal-field.component';
import { FieldOptionDirective } from 'app/shared/field-option.directive';
import { FileFieldComponent } from 'app/shared/file-field.component';
import { FilesFieldComponent } from 'app/shared/files-field.component';
import { FormatFieldValueComponent } from 'app/shared/format-field-value.component';
import { HiddenTextComponent } from 'app/shared/hidden-text.component';
import { HtmlFieldComponent } from 'app/shared/html-field.component';
import { ImagePropertiesDialogComponent } from 'app/shared/image-properties-dialog.component';
import { ImageUploadComponent } from 'app/shared/image-upload.component';
import { ImagesFieldComponent } from 'app/shared/images-field.component';
import { InputListFieldComponent } from 'app/shared/input-list-field.component';
import { InsertImageDialogComponent } from 'app/shared/insert-image-dialog.component';
import { LinkPropertiesDialogComponent } from 'app/shared/link-properties-dialog.component';
import { ManageFilesComponent } from 'app/shared/manage-files.component';
import { ManageImagesComponent } from 'app/shared/manage-images.component';
import { MultiSelectionFieldComponent } from 'app/shared/multi-selection-field.component';
import { MultipleUsersFieldComponent } from 'app/shared/multiple-users-field.component';
import { PickContactComponent } from 'app/shared/pick-contact.component';
import { RadioGroupFieldComponent } from 'app/shared/radio-group-field.component';
import { RichTextContainerComponent } from 'app/shared/rich-text-container.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { SingleSelectionFieldComponent } from 'app/shared/single-selection-field.component';
import { TempFileUploadComponent } from 'app/shared/temp-file-upload.component';
import { TextDialogComponent } from 'app/shared/text-dialog.component';
import { TextSelectionFieldComponent } from 'app/shared/text-selection-field.component';
import { TextAreaFieldComponent } from 'app/shared/textarea-field.component';
import { TimeIntervalFieldComponent } from 'app/shared/time-interval-field.component';
import { UrlFieldComponent } from 'app/shared/url-field.component';
import { UserFieldComponent } from 'app/shared/user-field.component';
import { AcceptAgreementsComponent } from 'app/ui/shared/accept-agreements.component';
import { AccountPipe } from 'app/ui/shared/account.pipe';
import { AddressDetailsWithCustomFieldsComponent } from 'app/ui/shared/address-details-with-custom-fields.component';
import { AddressDetailsComponent } from 'app/ui/shared/address-details.component';
import { AddressFormComponent } from 'app/ui/shared/address-form.component';
import { AgreementsContentDialogComponent } from 'app/ui/shared/agreement-content-dialog.component';
import { AgreementLinkComponent } from 'app/ui/shared/agreement-link.component';
import { AvatarLightboxComponent } from 'app/shared/avatar-lightbox.component';
import { DistanceSelectionFieldComponent } from 'app/ui/shared/distance-selection-field.component';
import { DistanceSelectionComponent } from 'app/ui/shared/distance-selection.component';
import { FieldPrivacyComponent } from 'app/ui/shared/field-privacy.component';
import { MapResultComponent } from 'app/ui/shared/map-result.component';
import { MobileResultComponent } from 'app/ui/shared/mobile-result.component';
import { MobileResultDirective } from 'app/ui/shared/mobile-result.directive';
import { PaginatorComponent } from 'app/ui/shared/paginator.component';
import { ProfileAddressesComponent } from 'app/ui/shared/profile-addresses.component';
import { ProfileImagesComponent } from 'app/ui/shared/profile-images.component';
import { RatingStatsComponent } from 'app/ui/shared/rating-stats.component';
import { ResultCategoryDirective } from 'app/ui/shared/result-category.directive';
import { ResultInfoWindowDirective } from 'app/ui/shared/result-info-window.directive';
import { ResultTableDirective } from 'app/ui/shared/result-table.directive';
import { ResultTileDirective } from 'app/ui/shared/result-tile.directive';
import { ResultTypeFieldComponent } from 'app/ui/shared/result-type-field.component';
import { ResultsLayoutComponent } from 'app/ui/shared/results-layout.component';
import { StaticMapComponent } from 'app/ui/shared/static-map.component';
import { TiledResultComponent } from 'app/ui/shared/tiled-result.component';
import { UiLayoutModule } from 'app/ui/shared/ui-layout.module';
import { UserInfoComponent } from 'app/ui/shared/user-info.component';
import { UserLinkComponent } from 'app/shared/user-link.component';
import { NotificationTypeSettingComponent } from 'app/ui/users/notification-settings/notification-type-setting.component';
import { RecaptchaFormsModule, RecaptchaModule } from 'ng-recaptcha';
import { BsModalService } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { SortableModule } from 'ngx-bootstrap/sortable';
import { NgxGalleryModule } from 'ngx-gallery-9';
import { WebcamModule } from 'ngx-webcam';

/**
 * Module shared by lazy-loaded modules
 */
@NgModule({
  declarations: [
    ResultTypeFieldComponent,
    ContentMonitorComponent,
    ResultsLayoutComponent,
    TiledResultComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    MobileResultDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    PaginatorComponent,
    MapResultComponent,
    MobileResultComponent,
    AddressFormComponent,
    FieldPrivacyComponent,
    ProfileAddressesComponent,
    ProfileImagesComponent,
    UserLinkComponent,
    UserInfoComponent,
    RatingStatsComponent,
    AcceptAgreementsComponent,
    AgreementLinkComponent,
    AgreementsContentDialogComponent,
    StaticMapComponent,
    NotificationTypeSettingComponent,
    DistanceSelectionFieldComponent,
    DistanceSelectionComponent,
    AddressDetailsComponent,

    AvatarLightboxComponent,
    ConfirmationComponent,
    ConfirmationPasswordComponent,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputListFieldComponent,
    HtmlFieldComponent,
    InsertImageDialogComponent,
    ImagePropertiesDialogComponent,
    LinkPropertiesDialogComponent,
    UrlFieldComponent,
    TextAreaFieldComponent,
    TextDialogComponent,
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
    ChipComponent,
    CaptchaComponent,
    ScanQrCodeComponent,
    CaptureCameraComponent,
    ButtonToggleComponent,
    HiddenTextComponent,
    AddressDetailsWithCustomFieldsComponent,

    AccountPipe,
  ],
  imports: [
    UiLayoutModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    ProgressbarModule.forRoot(),
    SortableModule.forRoot(),
    PaginationModule.forRoot(),
    WebcamModule,
    NgxGalleryModule,
  ],
  exports: [
    UiLayoutModule,
    PaginationModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    ProgressbarModule,
    SortableModule,
    WebcamModule,
    NgxGalleryModule,

    ResultTypeFieldComponent,
    ContentMonitorComponent,
    ResultsLayoutComponent,
    TiledResultComponent,
    ResultCategoryDirective,
    ResultTableDirective,
    MobileResultDirective,
    ResultTileDirective,
    ResultInfoWindowDirective,
    PaginatorComponent,
    MapResultComponent,
    MobileResultComponent,
    AddressFormComponent,
    FieldPrivacyComponent,
    ProfileAddressesComponent,
    ProfileImagesComponent,
    UserLinkComponent,
    UserInfoComponent,
    RatingStatsComponent,
    AcceptAgreementsComponent,
    AgreementLinkComponent,
    AgreementsContentDialogComponent,
    StaticMapComponent,
    NotificationTypeSettingComponent,
    DistanceSelectionFieldComponent,
    DistanceSelectionComponent,
    AddressDetailsComponent,

    AvatarLightboxComponent,
    ConfirmationComponent,
    ConfirmationPasswordComponent,
    RichTextContainerComponent,
    FormatFieldValueComponent,
    CustomFieldValueComponent,
    BooleanFieldComponent,
    InputListFieldComponent,
    HtmlFieldComponent,
    InsertImageDialogComponent,
    ImagePropertiesDialogComponent,
    LinkPropertiesDialogComponent,
    UrlFieldComponent,
    TextAreaFieldComponent,
    TextDialogComponent,
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
    ChipComponent,
    CaptchaComponent,
    ScanQrCodeComponent,
    CaptureCameraComponent,
    ButtonToggleComponent,
    HiddenTextComponent,
    AddressDetailsWithCustomFieldsComponent,

    AccountPipe,
  ],
  entryComponents: [
    AgreementsContentDialogComponent,
  ],
})
export class UiSharedModule {
  constructor(confirmation: ConfirmationService) {
    confirmation.confirmHandler = (modal: BsModalService, options: ConfirmOptions) => {
      return modal.show(ConfirmationComponent, {
        class: 'modal-form',
        initialState: options,
      });
    };
  }
}
