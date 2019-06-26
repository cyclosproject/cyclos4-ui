import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit
} from '@angular/core';
import { VoucherDataForBuy } from 'app/api/models/voucher-data-for-buy';
import { VouchersService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { BehaviorSubject } from 'rxjs';
import { Currency, VoucherTypeDetailed, BuyVoucher } from 'app/api/models';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';

export type BuyVouchersStep = 'select-type' | 'form' | 'confirm' | 'done';

/**
 * Component used to buy vouchers.
 * The data requested for the first time is to get all possible voucher types.
 */
@Component({
  selector: 'buy-vouchers',
  templateUrl: 'buy-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyVouchersComponent extends BasePageComponent<VoucherDataForBuy>
  implements OnInit {

  ConfirmationMode = ConfirmationMode;

  step$ = new BehaviorSubject<BuyVouchersStep>(null);

  singleType = false;
  user: string;
  form: FormGroup;

  confirmationPassword: FormControl;
  confirmationMode$ = new BehaviorSubject<ConfirmationMode>(null);

  // The data for a specific voucher type
  dataTypeForBuy: VoucherDataForBuy;
  canConfirm: boolean;

  constructor(injector: Injector, private voucherService: VouchersService) {
    super(injector);
  }

  get step(): BuyVouchersStep {
    return this.step$.value;
  }
  set step(step: BuyVouchersStep) {
    this.step$.next(step);
  }

  ngOnInit() {
    super.ngOnInit();
    const params = this.route.snapshot.params;
    this.user = this.authHelper.isSelf(params.user)
      ? this.ApiHelper.SELF
      : params.user;

    this.addSub(
      this.voucherService.getVoucherDataForBuy({ user: this.user })
        .subscribe(data => this.data = data)
    );
  }

  onDataInitialized(data: VoucherDataForBuy) {
    const types = data.types || [];
    if (types.length === 1) {
      this.singleType = true;
      this.toForm(types[0]);
    } else {
      this.step = 'select-type';
    }
  }

  backToSelectType() {
    this.step = 'select-type';
  }

  backToForm() {
    this.step = 'form';
  }

  buy(confirmationPassword?: string) {
    if (this.confirmationPasswordInput) {
      this.confirmationPassword.setValue(confirmationPassword);
      if (!validateBeforeSubmit(this.confirmationPassword)) {
        return;
      }
    }
    const buyVoucher: BuyVoucher = this.form.value;
    buyVoucher.type = this.dataTypeForBuy.type.id;
    const params = this.form.value;
    params.confirmationPassword = this.confirmationPassword.value;
    this.addSub(
      this.voucherService.buyVouchers(params).subscribe(() => this.step = 'done')
    );
  }

  toForm(type: VoucherTypeDetailed): void {
    this.addSub(this.voucherService.getVoucherDataForBuy({ user: this.user, type: type.id })
      .subscribe(data => {
        this.dataTypeForBuy = data;
        this.buildForm();
        this.step = 'form';
      })
    );
  }

  toConfirm(): void {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    this.canConfirm = this.authHelper.canConfirm(this.confirmationPasswordInput);
    if (!this.canConfirm) {
      this.notification.warning(this.authHelper.getConfirmationMessage(this.confirmationPasswordInput));
    } else if (!this.confirmationPasswordInput) {
      this.buy();
    } else {
      if (!this.confirmationPassword) {
        // The confirmation password is hold in a separated control
        this.confirmationPassword = this.formBuilder.control(null);
        this.confirmationPassword.setValidators(Validators.required);
      }
      this.step = 'confirm';
    }
  }

  private get confirmationPasswordInput() {
    return this.dataTypeForBuy.confirmationPasswordInput;
  }

  get currency(): Currency {
    return this.dataTypeForBuy.account.currency;
  }

  private buildForm(): void {
    if (this.form) {
      return; // form already created
    }

    this.form = this.formBuilder.group({
      count: new FormControl(''),
      amount: new FormControl('')
    });
  }
}
