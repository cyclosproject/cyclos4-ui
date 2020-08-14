import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiModule } from 'app/api/api.module';
import { UiRoutingModule } from 'app/ui/ui-routing.module';
import { ContentModule } from 'app/ui/content/content.module';
import { CoreModule } from 'app/core/core.module';
import { UiCoreModule } from 'app/ui/core/ui-core.module';
import { HomeModule } from 'app/ui/home/home.module';
import { INITIALIZE } from 'app/ui/initialize';
import { LoginModule } from 'app/ui/login/login.module';
import { RedirectToLocationComponent } from 'app/ui/redirect-to-location-component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';
import { UiComponent } from './ui.component';

@NgModule({
  declarations: [
    UiComponent,
    RedirectToLocationComponent
  ],
  imports: [
    HttpClientModule,
    ApiModule,
    CoreModule,
    UiCoreModule,
    UiSharedModule,
    BrowserAnimationsModule,
    UiRoutingModule,

    // Eagerly loaded modules
    LoginModule,
    HomeModule,
    ContentModule,
  ],
  providers: [
    INITIALIZE,
  ],
  bootstrap: [UiComponent],
})
export class UiModule { }
