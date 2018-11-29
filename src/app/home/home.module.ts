import { NgModule } from '@angular/core';
import { DashboardComponent } from 'app/home/dashboard.component';
import { HomeComponent } from 'app/home/home.component';
import { HomeContentComponent } from 'app/home/home-content.component';
import { UserHomeComponent } from 'app/home/user-home.component';
import { SharedModule } from 'app/shared/shared.module';


/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    HomeComponent,
    HomeContentComponent,
    UserHomeComponent,
    DashboardComponent
  ],
  imports: [
    SharedModule
  ]
})
export class HomeModule { }
