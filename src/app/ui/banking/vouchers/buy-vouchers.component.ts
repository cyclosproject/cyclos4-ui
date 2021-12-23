import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BuyVoucher, Currency, UserMenuEnum, VoucherBuyingPreview, VoucherTypeDetailed } from 'app/api/models';
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

  preview: VoucherBuyingPreview;
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

    const confirmationPasswordInput = this.preview?.confirmationPasswordInput;
    if (this.confirmationPasswordInput && !validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }

    const buyVoucher = this.preview.buyVoucher;
    const params = {
      user: this.user,
      confirmationPassword: confirmationPasswordInput ? this.confirmationPassword.value : null,
      body: buyVoucher,
    };
    this.addSub(this.voucherService.buyVouchers(params)
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
    this.addSub(this.voucherService.getVoucherDataForBuy({
      user: this.user,
      type: type.id,
      fields: ['-confirmationPasswordInput']
    })
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

    const type = this.dataTypeForBuy.type;
    const body = this.form.value as BuyVoucher;
    body.type = type.id;

    this.addSub(this.voucherService.previewBuyVouchers({
      fields: ['confirmationPasswordInput', 'totalAmount', 'buyVoucher'],
      user: this.user,
      body
    }).subscribe(preview => {
      preview.type = type;
      preview.user = this.data.user;
      const confirmationPasswordInput = preview.confirmationPasswordInput;
      this.canConfirm = this.authHelper.canConfirm(preview.confirmationPasswordInput);
      if (!this.canConfirm) {
        this.notification.warning(this.authHelper.getConfirmationMessage(confirmationPasswordInput));
        return;
      } else if (confirmationPasswordInput) { // can confirm and confirmation is required
        if (!this.confirmationPassword) {
          // The confirmation password is held in a separated control
          this.confirmationPassword = this.formBuilder.control(null);
          this.confirmationPassword.setValidators(Validators.required);
        } else {
          this.confirmationPassword.reset();
        }
      }
      this.step = 'confirm';
      this.preview = preview;
    }));
  }

  private get confirmationPasswordInput() {
    return this.dataTypeForBuy.confirmationPasswordInput;
  }

  private buildForm(): void {
    this.form = this.formBuilder.group({
      count: 1,
      amount: null,
      gift: false
    });
    this.form.addControl('paymentCustomValues', this.fieldHelper.customValuesFormGroup(this.dataTypeForBuy.paymentCustomFields));
    this.form.addControl('voucherCustomValues', this.fieldHelper.customValuesFormGroup(this.dataTypeForBuy.voucherCustomFields));
    this.form.get('count').setValue(1);
  }

  resolveMenu(data: VoucherDataForBuy) {
    return this.menu.userMenu(data.user, this.dataForFrontendHolder.dataForFrontend.voucherBuyingMenu == UserMenuEnum.MARKETPLACE ?
      Menu.SEARCH_MY_VOUCHERS_MARKETPLACE : Menu.SEARCH_MY_VOUCHERS_BANKING);
  }

}
