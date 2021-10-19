import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AddressHelperService } from 'app/ui/core/address-helper.service';
import { BankingHelperService } from 'app/ui/core/banking-helper.service';
import { ExportHelperService } from 'app/ui/core/export-helper.service';
import { LoginState } from 'app/ui/core/login-state';
import { LoginService } from 'app/ui/core/login.service';
import { MapsService } from 'app/ui/core/maps.service';
import { MenuBarComponent } from 'app/ui/core/menu-bar.component';
import { MenuService } from 'app/ui/core/menu.service';
import { MenusComponent } from 'app/ui/core/menus.component';
import { OperationHelperService } from 'app/ui/core/operation-helper.service';
import { PushNotificationComponent } from 'app/ui/core/push-notification.component';
import { PushNotificationsComponent } from 'app/ui/core/push-notifications.component';
import { SidenavComponent } from 'app/ui/core/sidenav.component';
import { TopBarComponent } from 'app/ui/core/top-bar.component';
import { MessageHelperService } from 'app/ui/core/message-helper.service';
import { UiErrorHandlerService } from 'app/ui/core/ui-error-handler.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { UserHelperService } from 'app/ui/core/user-helper.service';
import { TokenHelperService } from 'app/ui/core/token-helper.service';
import { WizardHelperService } from 'app/ui/core/wizard-helper.service';
import { CountriesResolve } from 'app/ui/countries.resolve';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Module that declares components used only by the core app module
 */
@NgModule({
  declarations: [
    TopBarComponent,
    MenuBarComponent,
    MenusComponent,
    SidenavComponent,
    PushNotificationComponent,
    PushNotificationsComponent,
  ],
  imports: [
    UiSharedModule,
  ],
  exports: [
    TopBarComponent,
    MenuBarComponent,
    MenusComponent,
    SidenavComponent,
    PushNotificationComponent,
    PushNotificationsComponent,
  ],
  providers: [
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
  ],
  entryComponents: [
    PushNotificationComponent
  ]
})
export class UiCoreModule {
  constructor(
    @Optional() @SkipSelf() parentModule: UiSharedModule,
  ) {
    if (parentModule) {
      throw new Error('UiCoreModule is already loaded. '
        + 'It should only be imported in AppModule');
    }
  }
}
