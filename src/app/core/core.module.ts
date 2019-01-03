import { BreakpointObserver } from '@angular/cdk/layout';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { forwardRef, LOCALE_ID, NgModule, Optional, Provider, SkipSelf, TRANSLATIONS_FORMAT, TRANSLATIONS } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { AddressHelperService } from 'app/core/address-helper.service';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { BannerService } from 'app/core/banner.service';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { CacheService } from 'app/core/cache.service';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { FormatService } from 'app/core/format.service';
import { LoginState } from 'app/core/login-state';
import { LoginService } from 'app/core/login.service';
import { MapsService } from 'app/core/maps.service';
import { MenuBarComponent } from 'app/core/menu-bar.component';
import { MenuService } from 'app/core/menu.service';
import { NotificationService } from 'app/core/notification.service';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { SidenavComponent } from 'app/core/sidenav.component';
import { SnackBarComponent } from 'app/core/snack-bar.component';
import { StateManager } from 'app/core/state-manager';
import { TopBarComponent } from 'app/core/top-bar.component';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { UserCacheService } from 'app/core/user-cache.service';
import { CountriesResolve } from 'app/countries.resolve';
import { LayoutService } from 'app/shared/layout.service';
import { SharedModule } from 'app/shared/shared.module';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LightboxModule } from 'ngx-lightbox';
import { NextRequestState } from './next-request-state';

export const API_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useExisting: forwardRef(() => ApiInterceptor),
  multi: true
};

// Translations configuration
export const TRANSLATION_FORMAT_PROVIDER: Provider = {
  provide: TRANSLATIONS_FORMAT,
  useValue: 'xlf'
};
declare const require;
export function translationsProvider(locale: string) {
  return require(`raw-loader!../../locale/cyclos4-ui.${locale}.xlf`);
}
export const TRANSLATIONS_PROVIDER: Provider = {
  provide: TRANSLATIONS,
  useFactory: translationsProvider,
  deps: [LOCALE_ID]
};


/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    TopBarComponent,
    MenuBarComponent,
    SidenavComponent,
    SnackBarComponent
  ],
  imports: [
    SharedModule,
    LightboxModule
  ],
  exports: [
    LightboxModule,
    TopBarComponent,
    MenuBarComponent,
    SidenavComponent,
    SnackBarComponent
  ],
  providers: [
    NextRequestState,
    ApiInterceptor,
    TRANSLATION_FORMAT_PROVIDER,
    TRANSLATIONS_PROVIDER,
    I18n,
    BreakpointObserver,
    DataForUiHolder,
    ErrorHandlerService,
    FormatService,
    LayoutService,
    MapsService,
    NotificationService,
    BreadcrumbService,
    StateManager,
    CacheService,
    ContentService,
    BannerService,
    LoginService,
    LoginState,
    MenuService,
    PushNotificationsService,
    CountriesResolve,
    UserCacheService,
    AuthHelperService,
    FieldHelperService,
    BankingHelperService,
    AddressHelperService,
    TransactionStatusService,
    API_INTERCEPTOR_PROVIDER,
    BsModalService
  ]
})
export class CoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: SharedModule
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. '
        + 'It should only be imported in AppModule');
    }
  }
}
