import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { VoucherInitialDataForRedeem, VoucherDataForRedeem } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Validators, FormControl, FormGroup } from '@angular/forms';
import { VouchersService } from 'app/api/services';
import { validateBeforeSubmit } from 'app/shared/helper';
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
  dataForRedeem$ = new BehaviorSubject<VoucherDataForRedeem>(null);
  form: FormGroup;
  userId: string;
  self: boolean;

  get dataForRedeem(): VoucherDataForRedeem {
    return this.dataForRedeem$.value;
  }

  set dataForRedeem(dataForRedeem: VoucherDataForRedeem) {
    this.dataForRedeem$.next(dataForRedeem);
  }

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

      this.addSub(this.voucherService.getVoucherDataForRedeem({ user: this.userId, token: this.token.value })
        .subscribe(data => {
          this.dataForRedeem = data;
          // Custom fields
          this.form = this.fieldHelper.customValuesFormGroup(this.dataForRedeem.customFields);
          this.step = 'confirm';
        }));
    } else {
      const params = { user: this.userId, token: this.token.value, body: { customValues: this.form.value } };
      this.addSub(this.voucherService.redeemVoucher(params)
        .subscribe(data => this.router.navigate(['banking', 'vouchers', data.voucherId])));
    }
  }

  backToForm() {
    this.step = 'form';
  }

  ngOnInit() {
    super.ngOnInit();
    this.userId = this.route.snapshot.paramMap.get('user');
    this.addSub(this.voucherService.getVoucherInitialDataForRedeem({ user: this.userId }).subscribe(data => {
      this.data = data;
      this.mask = this.data ? this.data.mask : '';
      this.self = this.authHelper.isSelf(data.user);
    }));
    this.step = 'form';
  }

  reload() {
    this.step = 'form';
    super.reload();
  }
}
