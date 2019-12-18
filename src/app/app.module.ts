import { LazyMapsAPILoader, LAZY_MAPS_API_CONFIG, MapsAPILoader } from '@agm/core';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ApiModule } from 'app/api/api.module';
import { DataForUi } from 'app/api/models';
import { AppRoutingModule } from 'app/app-routing.module';
import { ContentModule } from 'app/content/content.module';
import { CoreModule } from 'app/core/core.module';
import { DataForUiHolder } from 'app/core/data-for-ui-holder';
import { HomeModule } from 'app/home/home.module';
import { INITIALIZE } from 'app/initialize';
import { LoginModule } from 'app/login/login.module';
import { SharedModule } from 'app/shared/shared.module';
import { AppComponent } from './app.component';

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
    HttpClientModule,
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
    {
      provide: LAZY_MAPS_API_CONFIG,
      useFactory: lazyMapsApiConfig,
      deps: [DataForUiHolder]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
