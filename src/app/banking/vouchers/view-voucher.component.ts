import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { VoucherView, VoucherCreationTypeEnum, ImageSizeEnum, Transaction } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { HeadingAction } from 'app/shared/action';
import { BehaviorSubject } from 'rxjs';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { Menu } from 'app/shared/menu';

@Component({
  selector: 'app-view-voucher',
  templateUrl: './view-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewVoucherComponent extends BaseViewPageComponent<VoucherView> implements OnInit {

  qrCodeUrl$ = new BehaviorSubject<string>(null);

  constructor(
    injector: Injector,
    private voucherService: VouchersService,
    public bankingHelper: BankingHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.addSub(this.voucherService.viewVoucher({ key: key }).subscribe(voucher => {
      this.data = voucher;
      this.addSub(this.voucherService.getVoucherQrCode({ key: voucher.id, size: ImageSizeEnum.MEDIUM })
        .subscribe(image => this.qrCodeUrl$.next(URL.createObjectURL(image))));
      this.headingActions = this.initActions();
    }));
  }

  initActions(): HeadingAction[] {
    const actions: HeadingAction[] = [this.printAction];
    if (this.data.canCancel) {
      const label = this.data.creationType === VoucherCreationTypeEnum.BOUGHT ?
        this.i18n.voucher.cancelAndRefund : this.i18n.general.cancel;
      actions.push(new HeadingAction('cancel', label, () => {
        // TODO: CANCEL THE VOUCHER (we don't have api right now)
        this.notification.warning('It is not implemented yet.', true);
      }));
    }
    return actions;
  }

  /**
   * Returns the path to the given transaction
   * @param row The row
   */
  transferPath(transfer: Transaction): string[] {
    return ['/banking', 'transfer', this.bankingHelper.transactionNumberOrId(transfer)];
  }

  resolveMenu(voucher: VoucherView) {
    if (voucher.redeemer && this.authHelper.isSelfOrOwner(voucher.redeemer)) {
      return Menu.SEARCH_REDEEMED;
    } else if (voucher.buyer && this.authHelper.isSelfOrOwner(voucher.buyer)) {
      return Menu.SEARCH_BOUGHT_VOUCHERS;
    } else {
      return this.authHelper.searchUsersMenu();
    }
  }
}
