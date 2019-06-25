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
import { Currency, VoucherTypeDetailed } from 'app/api/models';
import { FormGroup, FormControl } from '@angular/forms';

export type BuyVoucherStep = 'select-type' | 'form' | 'confirm' | 'done';

/**
 * Component used to buy vouchers.
 * The data requested for the first time is to get all possible voucher types.
 */
@Component({
  selector: 'buy-voucher',
  templateUrl: 'buy-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyVoucherComponent extends BasePageComponent<VoucherDataForBuy>
  implements OnInit {
  step$ = new BehaviorSubject<BuyVoucherStep>(null);

  user: string;
  form: FormGroup;

  confirmationPassword: FormControl;

  // The data for a specific voucher type
  dataTypeForBuy: VoucherDataForBuy;
  canConfirm: boolean;

  constructor(injector: Injector, private voucherService: VouchersService) {
    super(injector);
  }

  get step(): BuyVoucherStep {
    return this.step$.value;
  }
  set step(step: BuyVoucherStep) {
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
      this.toForm(types[0]);
    } else {
      this.step = 'select-type';
    }
  }

  backToSelectType() {
    this.step = 'select-type';
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
    if (this.confirmationPassword) {
      // The confirmation password is hold in a separated control
      this.confirmationPassword = this.formBuilder.control(null);
    }

    const confirmationPasswordInput = this.dataTypeForBuy.confirmationPasswordInput;
    this.canConfirm = this.authHelper.canConfirm(confirmationPasswordInput);
    if (!this.canConfirm) {
      this.notification.warning(this.authHelper.getConfirmationMessage(confirmationPasswordInput));
    } else {
      this.step = 'confirm';
    }
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
