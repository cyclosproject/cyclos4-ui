import { NgModule } from '@angular/core';
import { AppComponent } from 'app/app.component';
import { AppRoutingModule } from 'app/app-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { ApiModule } from 'app/api/api.module';
import { INIT_API_CONFIGURATION } from 'app/bootstrap/init-api-configuration';
import { SETUP_LIGHTBOX } from 'app/bootstrap/setup-lightbox';
import { LOAD_GENERAL_TRANSLATION } from 'app/bootstrap/load-general-translation';
import { LOAD_DATA_FOR_UI } from 'app/bootstrap/load-data-for-ui';
import { LOAD_USER } from 'app/bootstrap/load-user';
import { LoginModule } from 'app/login/login.module';
import { CoreModule } from 'app/core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';
import { LOAD_REGISTRATION_GROUPS } from 'app/bootstrap/load-registration-groups';
import { SettingsModule } from './settings/settings.module';

/**
 * Root application module
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ApiModule,
    CoreModule,
    SharedModule,
    BrowserAnimationsModule,
    AppRoutingModule,

    // Eagerly loaded modules
    LoginModule,
    SettingsModule
  ],
  providers: [
    INIT_API_CONFIGURATION,
    SETUP_LIGHTBOX,
    LOAD_GENERAL_TRANSLATION,
    LOAD_REGISTRATION_GROUPS,
    LOAD_DATA_FOR_UI,
    LOAD_USER
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
