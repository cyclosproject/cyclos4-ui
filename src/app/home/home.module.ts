import { NgModule } from '@angular/core';
import { HomeComponent } from 'app/home/home.component';
import { SharedModule } from 'app/shared/shared.module';
import { QuickAccessComponent } from 'app/home/quick-access.component';


/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    HomeComponent,
    QuickAccessComponent
  ],
  imports: [
    SharedModule
  ]
})
export class HomeModule { }
