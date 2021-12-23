import { BreakpointObserver } from '@angular/cdk/layout';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { forwardRef, NgModule, Optional, Provider, SkipSelf } from '@angular/core';
import { ApiConfiguration } from 'app/api/api-configuration';
import { ApiI18nService } from 'app/core/api-i18n.service';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { CacheService } from 'app/core/cache.service';
import { DataForFrontendHolder } from 'app/core/data-for-frontend-holder';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { FormatService } from 'app/core/format.service';
import { I18nLoadingService } from 'app/core/i18n-loading.service';
import { IconLoadingService } from 'app/core/icon-loading.service';
import { LayoutService } from 'app/core/layout.service';
import { NextRequestState } from 'app/core/next-request-state';
import { NotificationService } from 'app/core/notification.service';
import { ScriptLoaderService } from 'app/core/script-loader.service';
import { ShortcutService } from 'app/core/shortcut.service';
import { StateManager } from 'app/core/state-manager';
import { I18nProvider } from 'app/i18n/i18n';
import { SharedBasicModule } from 'app/shared/shared-basic.module';
import { BsModalService } from 'ngx-bootstrap/modal';

export const API_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useExisting: forwardRef(() => ApiInterceptor),
  multi: true,
};

/**
 * Module that declares basic components used only by the core app module
 */
@NgModule({
  imports: [
    SharedBasicModule,
  ],
  exports: [
    SharedBasicModule,
  ],
  providers: [
    ApiConfiguration,
    NextRequestState,
    ApiInterceptor,
    I18nProvider,
    I18nLoadingService,
    ApiI18nService,
    IconLoadingService,
    BreakpointObserver,
    DataForFrontendHolder,
    ErrorHandlerService,
    FormatService,
    LayoutService,
    ShortcutService,
    NotificationService,
    StateManager,
    CacheService,
    ScriptLoaderService,
    API_INTERCEPTOR_PROVIDER,
    BsModalService,
  ]
})
export class CoreBasicModule {
  constructor(
    @Optional() @SkipSelf() parentModule: CoreBasicModule,
  ) {
    if (parentModule) {
      throw new Error('CoreBasicModule is already loaded. '
        + 'It should only be imported in AppModule');
    }
  }
}
