import { BreakpointObserver } from '@angular/cdk/layout';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { forwardRef, NgModule, Optional, Provider, SkipSelf, TRANSLATIONS, TRANSLATIONS_FORMAT } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { BannerService } from 'app/core/banner.service';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { CacheService } from 'app/core/cache.service';
import { ContentService } from 'app/core/content.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { FormatService } from 'app/core/format.service';
import { LoginState } from 'app/core/login-state';
import { LoginService } from 'app/core/login.service';
import { MapsService } from 'app/core/maps.service';
import { MenuBarComponent } from 'app/core/menu-bar.component';
import { MenuService } from 'app/core/menu.service';
import { NotificationService } from 'app/core/notification.service';
import { PersonalMenuComponent } from 'app/core/personal-menu.component';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { SidenavComponent } from 'app/core/sidenav.component';
import { SnackBarComponent } from 'app/core/snack-bar.component';
import { StateManager } from 'app/core/state-manager';
import { SvgIconRegistry } from 'app/core/svg-icon-registry';
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

// Use the require method provided by webpack
declare const require;
export const translations = require(`raw-loader!../../i18n/cyclos4-ui.en.xlf`);

/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    TopBarComponent,
    PersonalMenuComponent,
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
    PersonalMenuComponent,
    MenuBarComponent,
    SidenavComponent,
    SnackBarComponent
  ],
  providers: [
    NextRequestState,
    ApiInterceptor,
    // format of translations that you use
    { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
    // the translations that you need to load on your own
    { provide: TRANSLATIONS, useValue: translations },
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
    SvgIconRegistry,
    UserCacheService,
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
