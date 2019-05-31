import { BreakpointObserver } from '@angular/cdk/layout';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { forwardRef, NgModule, Optional, Provider, SkipSelf } from '@angular/core';
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
import { MenusComponent } from 'app/core/menus.component';
import { NotificationService } from 'app/core/notification.service';
import { OperationHelperService } from 'app/core/operation-helper.service';
import { PushNotificationComponent } from 'app/core/push-notification.component';
import { PushNotificationsComponent } from 'app/core/push-notifications.component';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { SidenavComponent } from 'app/core/sidenav.component';
import { SnackBarComponent } from 'app/core/snack-bar.component';
import { StateManager } from 'app/core/state-manager';
import { TopBarComponent } from 'app/core/top-bar.component';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { UserCacheService } from 'app/core/user-cache.service';
import { UserHelperService } from 'app/core/user-helper.service.ts';
import { CountriesResolve } from 'app/countries.resolve';
import { I18n } from 'app/i18n/i18n';
import { LayoutService } from 'app/shared/layout.service';
import { SharedModule } from 'app/shared/shared.module';
import { ShortcutService } from 'app/shared/shortcut.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { LightboxModule } from 'ngx-lightbox';
import { NextRequestState } from './next-request-state';

export const API_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useExisting: forwardRef(() => ApiInterceptor),
  multi: true
};

/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    TopBarComponent,
    MenuBarComponent,
    MenusComponent,
    SidenavComponent,
    SnackBarComponent,
    PushNotificationsComponent,
    PushNotificationComponent
  ],
  imports: [
    SharedModule,
    LightboxModule
  ],
  exports: [
    LightboxModule,
    TopBarComponent,
    MenuBarComponent,
    MenusComponent,
    SidenavComponent,
    SnackBarComponent,
    PushNotificationsComponent,
    PushNotificationComponent
  ],
  providers: [
    NextRequestState,
    ApiInterceptor,
    I18n,
    BreakpointObserver,
    DataForUiHolder,
    ErrorHandlerService,
    FormatService,
    LayoutService,
    ShortcutService,
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
    UserHelperService,
    BankingHelperService,
    AddressHelperService,
    TransactionStatusService,
    OperationHelperService,
    API_INTERCEPTOR_PROVIDER,
    BsModalService
  ],
  entryComponents: [
    PushNotificationComponent
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
