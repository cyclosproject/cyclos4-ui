import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ApiModule } from 'app/api/api.module';
import { CoreModule } from 'app/core/core.module';
import { SharedModule } from 'app/shared/shared.module';
import { AppRoutingModule } from 'app/app-routing.module';
import { LoginModule } from 'app/login/login.module';
import { HomeModule } from 'app/home/home.module';

import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { DataForUi } from 'app/api/models';
import { BROWSER_GLOBALS_PROVIDERS } from '@agm/core/utils/browser-globals';
import { INITIALIZE } from 'app/initialize';
import { MapsAPILoader, LazyMapsAPILoader, LAZY_MAPS_API_CONFIG } from '@agm/core';
import { ContentModule } from 'app/content/content.module';

export function lazyMapsApiConfig(dataForUiHolder: DataForUiHolder) {
  const config: any = {};
  dataForUiHolder.subscribe((dataForUi: DataForUi) => {
    if (dataForUi != null && dataForUi.mapData && dataForUi.mapData.googleMapsApiKey) {
      config.apiKey = dataForUi.mapData.googleMapsApiKey;
    }
  });
  return config;
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ApiModule,
    CoreModule,
    SharedModule,
    BrowserModule,
    AppRoutingModule,

    // Eagerly loaded modules
    LoginModule,
    HomeModule,
    ContentModule
  ],
  providers: [
    INITIALIZE,
    {
      provide: MapsAPILoader,
      useClass: LazyMapsAPILoader
    },
    ...BROWSER_GLOBALS_PROVIDERS,
    {
      provide: LAZY_MAPS_API_CONFIG,
      useFactory: lazyMapsApiConfig,
      deps: [DataForUiHolder]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
