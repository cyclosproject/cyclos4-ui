import { BreakpointObserver } from '@angular/cdk/layout';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { forwardRef, NgModule, Optional, Provider, SkipSelf } from '@angular/core';
import { ApiI18nService } from 'app/core/api-i18n.service';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { CacheService } from 'app/core/cache.service';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { FormatService } from 'app/core/format.service';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { LayoutService } from 'app/core/layout.service';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { SnackBarComponent } from 'app/core/snack-bar.component';
import { StateManager } from 'app/core/state-manager';
import { UserCacheService } from 'app/core/user-cache.service';
import { I18n } from 'app/i18n/i18n';
import { SharedModule } from 'app/shared/shared.module';
import { ShortcutService } from 'app/core/shortcut.service';
import { BsModalService } from 'ngx-bootstrap/modal';

export const API_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useExisting: forwardRef(() => ApiInterceptor),
  multi: true,
};

/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    SnackBarComponent
  ],
  imports: [
    SharedModule,
  ],
  exports: [
    SnackBarComponent
  ],
  providers: [
    NextRequestState,
    ApiInterceptor,
    I18n,
    ApiI18nService,
    I18nLoadingService,
    BreakpointObserver,
    DataForUiHolder,
    ErrorHandlerService,
    FormatService,
    LayoutService,
    ShortcutService,
    NotificationService,
    StateManager,
    CacheService,
    PushNotificationsService,
    UserCacheService,
    AuthHelperService,
    FieldHelperService,
    API_INTERCEPTOR_PROVIDER,
    BsModalService,
  ]
})
export class CoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: SharedModule,
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. '
        + 'It should only be imported in AppModule');
    }
  }
}
