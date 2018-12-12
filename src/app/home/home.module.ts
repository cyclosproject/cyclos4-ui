import { NgModule } from '@angular/core';
import { AccountStatusComponent } from 'app/home/dashboard/account-status.component';
import { BalanceHistoryChartDirective } from 'app/home/dashboard/balance-history-chart.directive';
import { DashboardContentComponent } from 'app/home/dashboard/dashboard-content.component';
import { DashboardItemComponent } from 'app/home/dashboard/dashboard-item.component';
import { LatestAdsComponent } from 'app/home/dashboard/latest-ads.component';
import { LatestUsersComponent } from 'app/home/dashboard/latest-users.component';
import { QuickAccessComponent } from 'app/home/dashboard/quick-access.component';
import { HomeComponent } from 'app/home/home.component';
import { SharedModule } from 'app/shared/shared.module';


/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    HomeComponent,
    DashboardItemComponent,
    QuickAccessComponent,
    AccountStatusComponent,
    BalanceHistoryChartDirective,
    LatestAdsComponent,
    LatestUsersComponent,
    DashboardContentComponent
  ],
  imports: [
    SharedModule
  ]
})
export class HomeModule { }
