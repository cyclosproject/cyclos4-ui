import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiModule } from 'app/api/api.module';
import { AppRoutingModule } from 'app/app-routing.module';
import { ContentModule } from 'app/content/content.module';
import { CoreModule } from 'app/core/core.module';
import { HomeModule } from 'app/home/home.module';
import { INITIALIZE } from 'app/initialize';
import { LoginModule } from 'app/login/login.module';
import { RedirectToLocationComponent } from 'app/redirect-to-location-component';
import { SharedModule } from 'app/shared/shared.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    RedirectToLocationComponent
  ],
  imports: [
    HttpClientModule,
    ApiModule,
    CoreModule,
    SharedModule,
    BrowserAnimationsModule,
    AppRoutingModule,

    // Eagerly loaded modules
    LoginModule,
    HomeModule,
    ContentModule,
  ],
  providers: [
    INITIALIZE,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
