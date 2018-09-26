import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { HomeComponent } from 'app/home/home.component';
import { DashboardComponent } from 'app/home/dashboard.component';

/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent
  ],
  imports: [
    SharedModule
  ]
})
export class HomeModule { }
