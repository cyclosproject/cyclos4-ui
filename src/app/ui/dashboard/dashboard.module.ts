import { NgModule } from '@angular/core';
import { AccountStatusComponent } from 'app/ui/dashboard/account-status.component';
import { BalanceHistoryGraphComponent } from 'app/ui/dashboard/balance-history-graph.component';
import { CombinedAccountStatusComponent } from 'app/ui/dashboard/combined-account-status.component';
import { LatestAdsComponent } from 'app/ui/dashboard/latest-ads.component';
import { LatestUsersComponent } from 'app/ui/dashboard/latest-users.component';
import { QuickAccessComponent } from 'app/ui/dashboard/quick-access.component';
import { DashboardRoutingModule } from 'app/ui/dashboard/dashboard-routing.module';
import { DashboardComponent } from 'app/ui/dashboard/dashboard.component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    DashboardComponent,
    QuickAccessComponent,
    AccountStatusComponent,
    CombinedAccountStatusComponent,
    BalanceHistoryGraphComponent,
    LatestAdsComponent,
    LatestUsersComponent
  ],
  imports: [
    DashboardRoutingModule,
    UiSharedModule,
  ]
})
export class DashboardModule { }
