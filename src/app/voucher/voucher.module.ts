import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CaptchaHelperService } from 'app/core/captcha-helper.service';
import { CoreBasicModule } from 'app/core/core-basic.module';
import { AvatarComponent } from 'app/shared/avatar.component';
import { CaptchaComponent } from 'app/shared/captcha.component';
import { CountdownButtonComponent } from 'app/shared/countdown-button.component';
import { CurrencyPipe } from 'app/shared/currency.pipe';
import { CustomFieldValueComponent } from 'app/shared/custom-field-value.component';
import { DateTimePipe } from 'app/shared/date-time.pipe';
import { DatePipe } from 'app/shared/date.pipe';
import { FieldErrorsComponent } from 'app/shared/field-errors.component';
import { FormatFieldValueComponent } from 'app/shared/format-field-value.component';
import { HeadingActionButtonComponent } from 'app/shared/heading-action-button.component';
import { InputFieldComponent } from 'app/shared/input-field.component';
import { BooleanFieldComponent } from 'app/shared/boolean-field.component';
import { MaskDirective } from 'app/shared/mask.directive';
import { NumberPipe } from 'app/shared/number.pipe';
import { NumbersOnlyDirective } from 'app/shared/numbers-only.directive';
import { PasswordInputComponent } from 'app/shared/password-input.component';
import { RichTextContainerComponent } from 'app/shared/rich-text-container.component';
import { ScanQrCodeComponent } from 'app/shared/scan-qrcode.component';
import { PaginatorComponent } from 'app/ui/shared/paginator.component';
import { VoucherChangePinComponent } from 'app/voucher/voucher-change-pin.component';
import { VoucherDetailsComponent } from 'app/voucher/voucher-details.component';
import { VoucherForgotPinComponent } from 'app/voucher/voucher-forgot-pin.component';
import { VoucherPinComponent } from 'app/voucher/voucher-pin.component';
import { VoucherRoutingModule } from 'app/voucher/voucher-routing.module';
import { VoucherSidenavComponent } from 'app/voucher/voucher-sidenav.component';
import { VoucherState } from 'app/voucher/voucher-state';
import { VoucherTokenComponent } from 'app/voucher/voucher-token.component';
import { VoucherToolbarComponent } from 'app/voucher/voucher-toolbar.component';
import { VoucherTopBarComponent } from 'app/voucher/voucher-top-bar.component';
import { VoucherComponent } from 'app/voucher/voucher.component';
import { VoucherNotificationSettingsComponent } from 'app/voucher/voucher-notification-settings.component';
import { VoucherGuard } from 'app/voucher/voucher.guard';
import { RecaptchaFormsModule, RecaptchaModule } from 'ng-recaptcha';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { NgxGalleryModule } from 'ngx-gallery-9';

@NgModule({
  declarations: [
    VoucherComponent,
    VoucherTokenComponent,
    VoucherPinComponent,
    VoucherChangePinComponent,
    VoucherForgotPinComponent,
    VoucherDetailsComponent,
    VoucherSidenavComponent,
    VoucherToolbarComponent,
    VoucherTopBarComponent,
    VoucherNotificationSettingsComponent,
    PasswordInputComponent,
    CaptchaComponent,
    HeadingActionButtonComponent,
    InputFieldComponent,
    BooleanFieldComponent,
    FieldErrorsComponent,
    ScanQrCodeComponent,
    MaskDirective,
    NumbersOnlyDirective,
    CountdownButtonComponent,
    CurrencyPipe,
    DatePipe,
    DateTimePipe,
    PaginatorComponent,
    CustomFieldValueComponent,
    FormatFieldValueComponent,
    RichTextContainerComponent,
    AvatarComponent,
    NumberPipe
  ],
  imports: [
    BrowserModule,
    VoucherRoutingModule,
    HttpClientModule,
    CoreBasicModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    PaginationModule.forRoot(),
    NgxGalleryModule,
  ],
  providers: [
    VoucherState,
    CaptchaHelperService,
    VoucherGuard
  ],
  bootstrap: [VoucherComponent],
})
export class VoucherModule { }
