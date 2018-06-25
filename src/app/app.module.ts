import { NgModule } from '@angular/core';
import { AppComponent } from 'app/app.component';
import { AppRoutingModule } from 'app/app-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { ApiModule } from 'app/api/api.module';
import { INITIALIZE } from 'app/initialize';
import { LoginModule } from 'app/login/login.module';
import { CoreModule } from 'app/core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SettingsModule } from './settings/settings.module';
import 'hammerjs';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material';
import { LAZY_MAPS_API_CONFIG, LazyMapsAPILoader, MapsAPILoader } from '@agm/core';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { DataForUi } from 'app/api/models';
import { BROWSER_GLOBALS_PROVIDERS } from '@agm/core/utils/browser-globals';

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
    INITIALIZE,
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {
        duration: 3500
      }
    },
    {
      provide: MapsAPILoader,
      useClass: LazyMapsAPILoader
    },
    ...BROWSER_GLOBALS_PROVIDERS,
    {
      provide: LAZY_MAPS_API_CONFIG,
      useFactory: (dataForUiHolder: DataForUiHolder) => {
        const config: any = {};
        dataForUiHolder.subscribe((dataForUi: DataForUi) => {
          if (dataForUi != null && dataForUi.mapData && dataForUi.mapData.googleMapsApiKey) {
            config.apiKey = dataForUi.mapData.googleMapsApiKey;
          }
        });
        return config;
      },
      deps: [DataForUiHolder]
    }
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
