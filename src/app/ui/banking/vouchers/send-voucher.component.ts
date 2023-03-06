import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Currency, SendVoucher, UserMenuEnum, VoucherSendingPreview, VoucherTypeDetailed } from 'app/api/models';
import { VoucherDataForBuy } from 'app/api/models/voucher-data-for-buy';
import { VouchersService } from 'app/api/services/vouchers.service';
import { validateBeforeSubmit } from 'app/shared/helper';
import { BasePageComponent } from 'app/ui/shared/base-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject } from 'rxjs';

export type SendVouchersStep = 'select-type' | 'form' | 'confirm';

/**
 * Component used to send vouchers to an e-mail address.
 * The data requested for the first time is to get all possible voucher types.
 */
@Component({
  selector: 'send-voucher',
  templateUrl: 'send-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendVoucherComponent extends BasePageComponent<VoucherDataForBuy>
  implements OnInit {

  step$ = new BehaviorSubject<SendVouchersStep>(null);

  singleType = false;
  user: string;
  form: FormGroup;

  preview: VoucherSendingPreview;
  confirmationPassword: FormControl;
  showSubmit$ = new BehaviorSubject(true);

  // The data for a specific voucher type
  dataTypeForBuy: VoucherDataForBuy;
  canConfirm: boolean;

  constructor(injector: Injector, private voucherService: VouchersService) {
    super(injector);
  }

  get step(): SendVouchersStep {
    return this.step$.value;
  }
  set step(step: SendVouchersStep) {
    this.step$.next(step);
  }

  ngOnInit() {
    super.ngOnInit();
    const params = this.route.snapshot.params;
    this.user = this.authHelper.isSelf(params.user) ? this.ApiHelper.SELF : params.user;
    this.addSub(this.voucherService.getVoucherDataForSend({ user: this.user }).subscribe(data => this.data = data));
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
   * Final action: send the voucher
   */
  send(confirmationPassword?: string) {
    if (confirmationPassword) {
      this.confirmationPassword.setValue(confirmationPassword);
    }

    const confirmationPasswordInput = this.preview?.confirmationPasswordInput;
    if (confirmationPasswordInput && !validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }

    const sendVoucher = this.preview.sendVoucher;
    const params = {
      user: this.user,
      confirmationPassword: confirmationPasswordInput ? this.confirmationPassword.value : null,
      body: sendVoucher,
    };
    this.addSub(
      this.voucherService.sendVoucher(params)
        .subscribe(result => {
          const id = result.vouchers[0];
          this.router.navigate(['/banking', 'vouchers', 'view', id]);
          this.notification.snackBar(this.i18n.voucher.send.done(sendVoucher.email));
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
    this.addSub(this.voucherService.getVoucherDataForSend({
      user: this.user,
      type: type.id,
      fields: ['-type']
    })
      .subscribe(data => {
        data.type = type;
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
    const body = this.form.value as SendVoucher;
    body.type = type.id;
    this.addSub(this.voucherService.previewSendVoucher({
      fields: ['confirmationPasswordInput', 'owner', 'sendVoucher'],
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

  private buildForm(): void {
    if (this.form) {
      this.form.reset(); // clear previous values (if any)
    } else {
      this.form = this.formBuilder.group({
        amount: 1,
        email: ['', Validators.compose([Validators.required, Validators.email])],
        message: ''
      });
      this.form.addControl('paymentCustomValues', this.fieldHelper.customValuesFormGroup(this.dataTypeForBuy.paymentCustomFields));
      this.form.addControl('voucherCustomValues', this.fieldHelper.customValuesFormGroup(this.dataTypeForBuy.voucherCustomFields));
    }
  }

  resolveMenu(data: VoucherDataForBuy) {
    return this.menu.userMenu(data.user, this.dataForFrontendHolder.dataForFrontend.voucherBuyingMenu == UserMenuEnum.MARKETPLACE ?
      Menu.SEARCH_MY_VOUCHERS_MARKETPLACE : Menu.SEARCH_MY_VOUCHERS_BANKING);
  }

}
