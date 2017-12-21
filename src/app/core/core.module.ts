import { NgModule, Optional, SkipSelf, Provider, forwardRef } from '@angular/core';

import { SidenavMenuComponent } from 'app/core/sidenav-menu.component';
import { LayoutBarComponent } from 'app/core/layout-bar.component';
import { TopBarComponent } from 'app/core/top-bar.component';
import { MenuBarComponent } from 'app/core/menu-bar.component';

import { SharedModule } from 'app/shared/shared.module';
import { GeneralMessages } from 'app/messages/general-messages';
import { NotificationService } from 'app/core/notification.service';
import { ErrorHandlerService } from 'app/core/error-handler.service';
import { FormatService } from 'app/core/format.service';
import { TranslationLoaderService } from 'app/core/translation-loader.service';
import { LayoutService } from 'app/core/layout.service';
import { LoginService } from 'app/core/login.service';
import { PersonalMenuComponent } from 'app/core/personal-menu.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material';
import { ApiDateAdapter } from 'app/core/api-date-adapter';
import { MenuService } from 'app/shared/menu.service';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { ApiInterceptor } from 'app/core/api.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RegistrationGroupsResolve } from 'app/registration-groups.resolve';
import { CountriesResolve } from 'app/countries.resolve';

export const API_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useExisting: forwardRef(() => ApiInterceptor),
  multi: true
};
export const DATE_ADAPTER_PROVIDER: Provider = {
  provide: DateAdapter,
  useExisting: forwardRef(() => ApiDateAdapter)
};
export function materialDateFormatsFactory(formatService: FormatService) {
  return formatService.materialDateFormats.value;
}
export const DATE_FORMATS_PROVIDER: Provider = {
  provide: MAT_DATE_FORMATS,
  useFactory: materialDateFormatsFactory,
  deps: [FormatService]
};

/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    LayoutBarComponent,
    TopBarComponent,
    MenuBarComponent,
    SidenavMenuComponent,
    PersonalMenuComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    LayoutBarComponent,
    TopBarComponent,
    MenuBarComponent,
    SidenavMenuComponent,
    PersonalMenuComponent
  ],
  providers: [
    ApiInterceptor,
    GeneralMessages,
    TranslationLoaderService,
    ErrorHandlerService,
    FormatService,
    LayoutService,
    NotificationService,
    LoginService,
    MenuService,
    PushNotificationsService,
    RegistrationGroupsResolve,
    CountriesResolve,
    ApiDateAdapter,
    API_INTERCEPTOR_PROVIDER,
    DATE_ADAPTER_PROVIDER,
    DATE_FORMATS_PROVIDER
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
