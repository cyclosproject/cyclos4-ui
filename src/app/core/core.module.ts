import { NgModule, Optional, SkipSelf } from '@angular/core';

import { MenuComponent } from "app/core/menu.component";
import { ToolbarComponent } from "app/core/toolbar.component";
import { SharedModule } from "app/shared/shared.module";

import { GeneralMessages } from "app/messages/general-messages";
import { NotificationService } from "app/core/notification.service";
import { ErrorHandlerService } from "app/core/error-handler.service";
import { FormatService } from "app/core/format.service";
import { TranslationLoaderService } from "app/core/translation-loader.service";
import { LayoutService } from "app/core/layout.service";
import { LoginService } from "app/core/login.service";
import { ApiConfigurationService } from "app/core/api-configuration.service";
import { MenuItemComponent } from "app/core/menu-item.component";
import { RouterModule } from "@angular/router";

/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    ToolbarComponent,
    MenuComponent,
    MenuItemComponent
  ],
  imports: [
    SharedModule,
    RouterModule
  ],
  exports: [
    ToolbarComponent,
    MenuComponent,
    MenuItemComponent
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
