import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Currency, VoucherTypeDetailed } from 'app/api/models';
import { VoucherDataForBuy } from 'app/api/models/voucher-data-for-buy';
import { VouchersService } from 'app/api/services';
import { BasePageComponent } from 'app/shared/base-page.component';
import { ConfirmationMode } from 'app/shared/confirmation-mode';
import { validateBeforeSubmit } from 'app/shared/helper';
import { Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type BuyVouchersStep = 'select-type' | 'form' | 'confirm';

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

  customFieldControlsMap: Map<string, FormControl>;

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
      body: body
    };
    this.addSub(
      this.voucherService.buyVouchers(params)
        .subscribe((ids: string[]) => {
          if (ids.length === 1) {
            this.router.navigate(['banking', 'vouchers', ids[0]]);
          } else {
            this.router.navigate(['banking', this.user, 'vouchers', 'bought']);
          }
          this.notification.snackBar(this.i18n.voucher.buy.done);
        })
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
      })
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
    if (this.form) {
      this.form.reset(); // clear previous values (if any)
    } else {
      this.customFieldControlsMap = this.fieldHelper.customValuesFormControlMap(this.dataTypeForBuy.customFields);
      this.form = this.formBuilder.group({
        count: new FormControl(''),
        amount: new FormControl(''),
      });
      if (this.customFieldControlsMap.size > 0) {
        const fieldValues = new FormGroup({});
        for (const c of this.customFieldControlsMap) {
          fieldValues.addControl(c[0], c[1]);
        }
        this.form.setControl('customValues', fieldValues);
      }
    }

    this.form.get('count').setValue(1);
  }

  resolveMenu(data: VoucherDataForBuy) {
    return this.authHelper.userMenu(data.user, Menu.BUY_VOUCHER);
  }

}
