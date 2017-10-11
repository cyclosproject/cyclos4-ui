import { NgModule, Optional, SkipSelf } from '@angular/core';

import { SidenavMenuComponent } from "app/core/sidenav-menu.component";
import { LayoutBarComponent } from "app/core/layout-bar.component";
import { TopBarComponent } from "app/core/top-bar.component";
import { MenuBarComponent } from "app/core/menu-bar.component";

import { SharedModule } from "app/shared/shared.module";
import { GeneralMessages } from "app/messages/general-messages";
import { NotificationService } from "app/core/notification.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { FormatService } from "app/core/format.service";
import { TranslationLoaderService } from "app/core/translation-loader.service";
import { LayoutService } from "app/core/layout.service";
import { LoginService } from "app/core/login.service";
import { ApiConfigurationService } from "app/core/api-configuration.service";
import { PersonalMenuComponent } from 'app/core/personal-menu.component';

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
    ApiConfigurationService,
    GeneralMessages,
    TranslationLoaderService,
    ErrorHandlerService,
    FormatService,
    LayoutService,
    NotificationService,
    LoginService
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
