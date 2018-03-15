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
    INITIALIZE
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
