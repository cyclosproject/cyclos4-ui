import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  VoucherDataForRedeem,
  VoucherInitialDataForTransaction,
  VoucherRedeemPreview,
  VoucherTransactionResult
} from 'app/api/models';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BaseVoucherTransactionComponent } from 'app/ui/banking/vouchers/base-voucher-transaction.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'redeem-voucher',
  templateUrl: './redeem-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RedeemVoucherComponent
  extends BaseVoucherTransactionComponent<VoucherDataForRedeem, VoucherRedeemPreview>
  implements OnInit
{
  // Pin when in preview
  pin = new FormControl('', Validators.required);

  constructor(injector: Injector) {
    super(injector);
  }

  protected getInitialData(user: string): Observable<VoucherInitialDataForTransaction> {
    return this.vouchersService.getVoucherInitialDataForRedeem({ user });
  }

  protected getVoucherTransactionData(params: { user: string; token: string }): Observable<VoucherDataForRedeem> {
    return this.vouchersService.getVoucherDataForRedeem(params);
  }
  protected setupForm(form: FormGroup, data: VoucherDataForRedeem): void {
    if (data.type.allowPartialRedeems) {
      form.addControl('amount', new FormControl(null, Validators.required));
    }
    if (data.pinInput) {
      form.addControl('pin', new FormControl(null, Validators.required));
    }
  }

  protected previewTransaction(params: { user: string; token: string; body: any }): Observable<VoucherRedeemPreview> {
    return this.vouchersService.previewVoucherRedeem(params);
  }

  protected performTransaction(
    preview: VoucherRedeemPreview | null,
    params: { user: string; token: string; body?: any }
  ): Observable<VoucherTransactionResult> {
    if (preview) {
      params.body = preview.redeem;
      params.body.pin = this.pin.value;
    }
    return this.vouchersService.redeemVoucher(params);
  }

  resendPin() {
    this.addSub(
      this.vouchersService.resendPin({ key: this.dataForTransaction.token }).subscribe(res => {
        this.notification.info(this.i18n.voucher.pinSent((res || []).join(', ')));
      })
    );
  }

  validatePerformFromForm(_data: VoucherDataForRedeem, form: FormGroup): boolean {
    return !!validateBeforeSubmit(form);
  }

  protected validatePerformFromPreview(preview: VoucherRedeemPreview): boolean {
    return !preview.pinInput || !!validateBeforeSubmit(this.pin);
  }
}
