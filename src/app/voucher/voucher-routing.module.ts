import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from 'app/shared/not-found.component';
import { VoucherActivateGiftComponent } from 'app/voucher/voucher-activate-gift.component';
import { VoucherChangePinComponent } from 'app/voucher/voucher-change-pin.component';
import { VoucherDetailsComponent } from 'app/voucher/voucher-details.component';
import { VoucherForgotPinComponent } from 'app/voucher/voucher-forgot-pin.component';
import { VoucherNotificationSettingsComponent } from 'app/voucher/voucher-notification-settings.component';
import { VoucherPinComponent } from 'app/voucher/voucher-pin.component';
import { VoucherTokenComponent } from 'app/voucher/voucher-token.component';
import { VoucherGuard } from 'app/voucher/voucher.guard';

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
    path: 'activate-gift',
    canActivate: [VoucherGuard],
    component: VoucherActivateGiftComponent
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
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(rootRoutes)],
  exports: [RouterModule]
})
export class VoucherRoutingModule {}
