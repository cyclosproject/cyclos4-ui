import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { VoucherDetailsComponent } from 'app/voucher/voucher-details.component';
import { VoucherPinComponent } from 'app/voucher/voucher-pin.component';
import { VoucherForgotPinComponent } from 'app/voucher/voucher-forgot-pin.component';
import { VoucherTokenComponent } from 'app/voucher/voucher-token.component';
import { VoucherChangePinComponent } from 'app/voucher/voucher-change-pin.component';
import { VoucherGuard } from 'app/voucher/voucher.guard';
import { VoucherNotificationSettingsComponent } from 'app/voucher/voucher-notification-settings.component';

const rootRoutes: Routes = [
  {
    path: '',
    redirectTo: '/token',
    pathMatch: 'full'
  },
  {
    path: 'pin',
    canActivate: [VoucherGuard],
    component: VoucherPinComponent
  },
  {
    path: 'forgot-pin',
    canActivate: [VoucherGuard],
    component: VoucherForgotPinComponent
  },
  {
    path: 'change-pin',
    canActivate: [VoucherGuard],
    component: VoucherChangePinComponent
  },
  {
    path: 'notification-settings',
    canActivate: [VoucherGuard],
    component: VoucherNotificationSettingsComponent
  },
  {
    path: 'details',
    canActivate: [VoucherGuard],
    component: VoucherDetailsComponent
  },
  {
    path: ':token',
    component: VoucherTokenComponent
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(rootRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class VoucherRoutingModule { }
