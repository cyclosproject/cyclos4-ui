import { NgModule } from '@angular/core';
import { DashboardComponent } from 'app/home/dashboard.component';
import { GuestHomeComponent } from 'app/home/guest-home.component';
import { HomeComponent } from 'app/home/home.component';
import { UserHomeComponent } from 'app/home/user-home.component';
import { SharedModule } from 'app/shared/shared.module';


/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    HomeComponent,
    GuestHomeComponent,
    UserHomeComponent,
    DashboardComponent
  ],
  imports: [
    SharedModule
  ]
})
export class HomeModule { }
