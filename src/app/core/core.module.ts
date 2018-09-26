import { NgModule, Optional, SkipSelf, Provider, forwardRef, TRANSLATIONS, TRANSLATIONS_FORMAT } from '@angular/core';

import { NotificationService } from 'app/core/notification.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { FormatService } from 'app/core/format.service';
import { MapsService } from 'app/core/maps.service';
import { LoginService } from 'app/core/login.service';
import { MenuService } from 'app/core/menu.service';
import { StateManager } from 'app/core/state-manager';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CountriesResolve } from 'app/countries.resolve';
import { LightboxModule } from 'ngx-lightbox';
import { NextRequestState } from './next-request-state';
import { SvgIconRegistry } from 'app/core/svg-icon-registry';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { UserCacheService } from 'app/core/user-cache.service';
import { SharedModule } from 'app/shared/shared.module';

import { I18n } from '@ngx-translate/i18n-polyfill';
import { BreadcrumbService } from 'app/core/breadcrumb.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LayoutService } from 'app/shared/layout.service';
import { TopBarComponent } from 'app/core/top-bar.component';

import { BreakpointObserver } from '@angular/cdk/layout';
import { MenuBarComponent } from 'app/core/menu-bar.component';
import { PersonalMenuComponent } from 'app/core/personal-menu.component';
import { SidenavComponent } from 'app/core/sidenav.component';
import { SnackBarComponent } from 'app/core/snack-bar.component';
import { LoginState } from 'app/core/login-state';
import { TransactionStatusService } from 'app/core/transaction-status.service';

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
