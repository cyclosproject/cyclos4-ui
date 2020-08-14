import { NgModule } from '@angular/core';
import { AccountStatusComponent } from 'app/ui/home/dashboard/account-status.component';
import { BalanceHistoryChartDirective } from 'app/ui/home/dashboard/balance-history-chart.directive';
import { CombinedAccountStatusComponent } from 'app/ui/home/dashboard/combined-account-status.component';
import { DashboardContentComponent } from 'app/ui/home/dashboard/dashboard-content.component';
import { DashboardItemComponent } from 'app/ui/home/dashboard/dashboard-item.component';
import { LatestAdsComponent } from 'app/ui/home/dashboard/latest-ads.component';
import { LatestUsersComponent } from 'app/ui/home/dashboard/latest-users.component';
import { QuickAccessComponent } from 'app/ui/home/dashboard/quick-access.component';
import { HomeComponent } from 'app/ui/home/home.component';
import { RedirectToLandingPageComponent } from 'app/ui/home/redirect-to-landing-page-component';
import { UiSharedModule } from 'app/ui/shared/ui-shared.module';

/**
 * Module comprising the home page functionality
 */
@NgModule({
  declarations: [
    RedirectToLandingPageComponent,
    HomeComponent,
    DashboardItemComponent,
    QuickAccessComponent,
    AccountStatusComponent,
    CombinedAccountStatusComponent,
    BalanceHistoryChartDirective,
    LatestAdsComponent,
    LatestUsersComponent,
    DashboardContentComponent,
  ],
  imports: [
    UiSharedModule,
  ],
})
export class HomeModule { }
