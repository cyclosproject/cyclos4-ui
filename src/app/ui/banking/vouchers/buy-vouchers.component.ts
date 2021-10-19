import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Currency, VoucherTypeDetailed } from 'app/api/models';
import { VoucherDataForBuy } from 'app/api/models/voucher-data-for-buy';
import { VouchersService } from 'app/api/services/vouchers.service';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type BuyVouchersStep = 'select-type' | 'form' | 'confirm';

/**
 * Component used to buy vouchers.
 * The data requested for the first time is to get all possible voucher types.
 */
@Component({
  selector: 'buy-vouchers',
  templateUrl: 'buy-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        .subscribe(data => this.data = data),
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

  get currency(): Currency {
    return this.dataTypeForBuy.account.currency;
  }

  /**
   * Final action: buy the vouchers
   */
  buy(confirmationPassword?: string) {
    if (confirmationPassword) {
      this.confirmationPassword.setValue(confirmationPassword);
    }

    if (this.confirmationPasswordInput && !validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }

    const body = this.form.value;
    body.type = this.dataTypeForBuy.type.id;
    const params = {
      user: this.user,
      confirmationPassword: this.confirmationPasswordInput ? this.confirmationPassword.value : null,
      body,
    };
    this.addSub(
      this.voucherService.buyVouchers(params)
        .subscribe((ids: string[]) => {
          if (ids.length === 1) {
            this.router.navigate(['/banking', 'vouchers', 'view', ids[0]]);
          } else {
            this.router.navigate(['/banking', this.user, 'vouchers']);
          }
          this.notification.snackBar(this.i18n.voucher.buy.done);
        }),
    );
  }

  backToSelectType() {
    this.step = 'select-type';
  }

  backToForm() {
    this.step = 'form';
  }

  /**
   * Go to second step
   */
  toForm(type: VoucherTypeDetailed): void {
    this.addSub(this.voucherService.getVoucherDataForBuy({ user: this.user, type: type.id })
      .subscribe(data => {
        this.dataTypeForBuy = data;
        this.buildForm();
        this.step = 'form';
      }),
    );
  }

  /**
   * Go to third step
   */
  toConfirm(): void {
    if (!validateBeforeSubmit(this.form)) {
      return;
    }

    this.canConfirm = this.authHelper.canConfirm(this.confirmationPasswordInput);
    if (!this.canConfirm) {
      this.notification.warning(this.authHelper.getConfirmationMessage(this.confirmationPasswordInput));
      return;
    } else if (this.confirmationPasswordInput) { // can confirm and confirmation is required
      if (!this.confirmationPassword) {
        // The confirmation password is hold in a separated control
        this.confirmationPassword = this.formBuilder.control(null);
        this.confirmationPassword.setValidators(Validators.required);
      } else {
        this.confirmationPassword.reset();
      }
    }
    this.step = 'confirm';
  }

  private get confirmationPasswordInput() {
    return this.dataTypeForBuy.confirmationPasswordInput;
  }

  private buildForm(): void {
    this.form = this.formBuilder.group({
      count: 1,
      amount: null,
    });
    this.form.addControl('paymentCustomValues', this.fieldHelper.customValuesFormGroup(this.dataTypeForBuy.paymentCustomFields));
    this.form.addControl('voucherCustomValues', this.fieldHelper.customValuesFormGroup(this.dataTypeForBuy.voucherCustomFields));
    this.form.get('count').setValue(1);
  }

  resolveMenu(data: VoucherDataForBuy) {
    return this.menu.userMenu(data.user, Menu.SEARCH_MY_VOUCHERS);
  }

}
