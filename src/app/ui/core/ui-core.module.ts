import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CoreBasicModule } from 'app/core/core-basic.module';
import { PushNotificationsService } from 'app/core/push-notifications.service';
import { StoredFileCacheService } from 'app/core/stored-file-cache.service';
import { UserCacheService } from 'app/core/user-cache.service';
import { SharedModule } from 'app/shared/shared.module';
import { ContentPageComponent } from 'app/ui/content/content-page.component';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { ExportHelperService } from 'app/ui/core/export-helper.service';
import { HelpComponent } from 'app/ui/core/help.component';
import { HomeComponent } from 'app/ui/core/home.component';
import { ImportsHelperService } from 'app/ui/core/imports-helper.service';
import { LoginState } from 'app/ui/core/login-state';
import { LoginService } from 'app/ui/core/login.service';
import { MapsService } from 'app/ui/core/maps.service';
import { MenuBarComponent } from 'app/ui/core/menu-bar.component';
import { MenuService } from 'app/ui/core/menu.service';
import { MenusComponent } from 'app/ui/core/menus.component';
import { MessageHelperService } from 'app/ui/core/message-helper.service';
import { OperationHelperService } from 'app/ui/core/operation-helper.service';
import { PushNotificationComponent } from 'app/ui/core/push-notification.component';
import { PushNotificationsComponent } from 'app/ui/core/push-notifications.component';
import { QuickAccessHelperService } from 'app/ui/core/quick-access-helper.service';
import { RedirectToLandingPageComponent } from 'app/ui/core/redirect-to-landing-page-component';
import { SidenavComponent } from 'app/ui/core/sidenav.component';
import { TokenHelperService } from 'app/ui/core/token-helper.service';
import { TopBarComponent } from 'app/ui/core/top-bar.component';
import { UiErrorHandlerService } from 'app/ui/core/ui-error-handler.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { WizardHelperService } from 'app/ui/core/wizard-helper.service';
import { CountriesResolve } from 'app/ui/countries.resolve';
import { LoginComponent } from 'app/ui/login/login.component';
import { RedirectToLocationComponent } from 'app/ui/redirect-to-location-component';
import { UiLayoutModule } from 'app/ui/shared/ui-layout.module';


/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    RedirectToLandingPageComponent,
    RedirectToLocationComponent,
    HomeComponent,
    HelpComponent,
    LoginComponent,
    ContentPageComponent,
    TopBarComponent,
    MenuBarComponent,
    MenusComponent,
    SidenavComponent,
    PushNotificationComponent,
    PushNotificationsComponent,
  ],
  imports: [
    CoreBasicModule,
    UiLayoutModule,
  ],
  exports: [
    CoreBasicModule,
    UiLayoutModule,

    TopBarComponent,
    MenuBarComponent,
    MenusComponent,
    SidenavComponent,
    PushNotificationComponent,
    PushNotificationsComponent,
  ],
  providers: [
    PushNotificationsService,
    UserCacheService,
    StoredFileCacheService,
    UiLayoutService,
    UiErrorHandlerService,
    MapsService,
    LoginService,
    LoginState,
    MenuService,
    CountriesResolve,
    UserHelperService,
    BankingHelperService,
    AddressHelperService,
    ExportHelperService,
    OperationHelperService,
    WizardHelperService,
    TokenHelperService,
    MessageHelperService,
    QuickAccessHelperService,
    ImportsHelperService
  ],
  entryComponents: [
    PushNotificationComponent
  ]
})
export class UiCoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: SharedModule,
  ) {
    if (parentModule) {
      throw new Error('UiCoreModule is already loaded. '
        + 'It should only be imported in AppModule');
    }
  }
}
