import { NgModule } from '@angular/core';
import { DashboardItemComponent } from 'app/home/dashboard/dashboard-item.component';
import { QuickAccessComponent } from 'app/home/dashboard/quick-access.component';
import { HomeComponent } from 'app/home/home.component';
import { SharedModule } from 'app/shared/shared.module';
import { AccountStatusComponent } from 'app/home/dashboard/account-status.component';
import { BalanceHistoryChartDirective } from 'app/home/dashboard/balance-history-chart.directive';


/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    HomeComponent,
    DashboardItemComponent,
    QuickAccessComponent,
    AccountStatusComponent,
    BalanceHistoryChartDirective
  ],
  imports: [
    SharedModule
  ]
})
export class HomeModule { }
