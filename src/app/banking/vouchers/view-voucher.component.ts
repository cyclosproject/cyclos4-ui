import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import {
  VoucherView, VoucherCreationTypeEnum, ImageSizeEnum, Transaction, CreateDeviceConfirmation,
  DeviceConfirmationTypeEnum,
  VoucherCancelActionEnum
} from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { HeadingAction } from 'app/shared/action';
import { BehaviorSubject } from 'rxjs';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { FormControl, Validators } from '@angular/forms';
import { validateBeforeSubmit } from 'app/shared/helper';

@Component({
  selector: 'app-view-voucher',
  templateUrl: './view-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewVoucherComponent extends BaseViewPageComponent<VoucherView> implements OnInit {

  qrCodeUrl$ = new BehaviorSubject<string>(null);
  createDeviceConfirmation: () => CreateDeviceConfirmation;
  canConfirm: boolean;
  confirmationPassword: FormControl;

  constructor(
    injector: Injector,
    private voucherService: VouchersService,
    public bankingHelper: BankingHelperService
  ) { super(injector); }

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.addSub(this.voucherService.viewVoucher({ key: key }).subscribe(voucher => this.data = voucher));
  }

  onDataInitialized(_data) {
    this.addSub(this.voucherService.getVoucherQrCode({ key: _data.id, size: ImageSizeEnum.MEDIUM })
      .subscribe(image => this.qrCodeUrl$.next(URL.createObjectURL(image))));
    this.createDeviceConfirmation = () => ({
      type: DeviceConfirmationTypeEnum.MANAGE_VOUCHER,
      token: _data.id
    });
    this.canConfirm = this.authHelper.canConfirm(_data.confirmationPasswordInput);
    if (_data.confirmationPasswordInput) {
      this.confirmationPassword = this.formBuilder.control('confirmationPassword', Validators.required);
    }
    this.headingActions = this.initActions(_data);
  }

  initActions(data: VoucherView): HeadingAction[] {
    const actions: HeadingAction[] = [this.printAction];
    if (data.cancelAction) {
      const label = this.data.creationType === VoucherCreationTypeEnum.BOUGHT ?
        this.i18n.voucher.cancelAndRefund : this.i18n.general.cancel;
      actions.push(new HeadingAction('cancel', label, () => {
        // Handle the case that the confirmation password cannot be used
        if (!this.canConfirm) {
          this.notification.warning(this.authHelper.getConfirmationMessage(data.confirmationPasswordInput));
        }
        if (this.data.confirmationPasswordInput) {
          // A confirmation is required
          this.notification.confirm({
            title: this.cancelConfirmationTitle(data.cancelAction),
            passwordInput: data.confirmationPasswordInput,
            createDeviceConfirmation: this.createDeviceConfirmation,
            callback: params => this.cancel(params.confirmationPassword)
          });
        } else {
          // Save directly
          this.cancel();
        }
      }));
    }
    return actions;
  }

  cancel(confirmationPassword?: string) {
    if (!confirmationPassword && this.confirmationPassword) {
      confirmationPassword = this.confirmationPassword.value;
    }
    if (!validateBeforeSubmit(this.confirmationPassword)) {
      return;
    }
    this.addSub(this.voucherService.cancelVoucher({ key: this.data.id, confirmationPassword: confirmationPassword })
      .subscribe(() => {
        this.reload();
        this.notification.snackBar(this.i18n.voucher.cancel.done);
      }));
  }

  cancelConfirmationTitle(cancelAction: VoucherCancelActionEnum): string {
    switch (cancelAction) {
      case VoucherCancelActionEnum.CANCEL_AND_REFUND:
        return this.i18n.voucher.cancel.refundConfirmation;
      case VoucherCancelActionEnum.CANCEL_PENDING_PACK:
        return this.i18n.voucher.cancel.packConfirmation;
      case VoucherCancelActionEnum.CANCEL_GENERATED:
        return this.i18n.voucher.cancel.confirmation;
      case VoucherCancelActionEnum.CANCEL_PENDING_SINGLE:
        return this.i18n.voucher.cancel.confirmation;
    }

    return '';
  }

  /**
   * Returns the path to the given transaction
   * @param row The row
   */
  transferPath(transfer: Transaction): string[] {
    return ['/banking', 'transfer', this.bankingHelper.transactionNumberOrId(transfer)];
  }
}
