import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from 'app/ui/dashboard/dashboard.component';

const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  }
];

/**
 * * Routes for the personal module
 */
@NgModule({
  imports: [
    RouterModule.forChild(dashboardRoutes),
  ],
  exports: [
    RouterModule,
  ],
})
export class DashboardRoutingModule {
}
