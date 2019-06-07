import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { VoucherInitialDataForRedeem, VoucherDataForRedeem } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Validators, FormControl } from '@angular/forms';
import { VouchersService } from 'app/api/services';
import { validateBeforeSubmit } from 'app/shared/helper';
import { ApiHelper } from 'app/shared/api-helper';
import { BehaviorSubject } from 'rxjs';

export type RedeemStep = 'form' | 'confirm';

@Component({
  selector: 'app-redeem-voucher',
  templateUrl: './redeem-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RedeemVoucherComponent extends BasePageComponent<VoucherInitialDataForRedeem> implements OnInit {

  step$ = new BehaviorSubject<RedeemStep>(null);
  token = new FormControl('', Validators.required);
  mask = '';
  dataForRedeem: VoucherDataForRedeem;

  constructor(
    injector: Injector,
    private voucherService: VouchersService
  ) {
    super(injector);
  }

  get step(): RedeemStep {
    return this.step$.value;
  }
  set step(step: RedeemStep) {
    this.step$.next(step);
  }

  submit() {
    if (this.step === 'form') {
      if (!validateBeforeSubmit(this.token)) {
        return;
      }
      this.voucherService.getVoucherDataForRedeem({ user: ApiHelper.SELF, token: this.token.value }).subscribe(data => {
        this.dataForRedeem = data;
        this.step = 'confirm';
      });
    } else {
      this.voucherService.redeemVoucher({ user: ApiHelper.SELF, token: this.token.value }).subscribe(data => {
        this.router.navigate(['banking', 'vouchers', data.voucherId]);
      });
    }
  }

  ngOnInit() {
    super.ngOnInit();
    this.voucherService.getVoucherInitialDataForRedeem({ user: ApiHelper.SELF }).subscribe(data => {
      this.data = data;
      this.mask = this.data ? this.data.mask : '';
    });
    this.step = 'form';
  }

  reload() {
    this.step = 'form';
    super.reload();
  }

}
