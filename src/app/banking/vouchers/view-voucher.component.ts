import { Component, OnInit, Injector, ChangeDetectionStrategy } from '@angular/core';
import { VoucherView, VoucherCreationTypeEnum } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';
import { HeadingAction } from 'app/shared/action';

@Component({
  selector: 'app-view-voucher',
  templateUrl: './view-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewVoucherComponent extends BaseViewPageComponent<VoucherView> implements OnInit {


  constructor(
    injector: Injector,
    private voucherService: VouchersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const key = this.route.snapshot.paramMap.get('key');
    this.addSub(this.voucherService.viewVoucher({ key: key }).subscribe(voucher => {
      this.data = voucher;
      this.headingActions = this.initActions(voucher);
    }));
  }

  initActions(voucher: VoucherView): HeadingAction[] {
    const actions: HeadingAction[] = [this.printAction];
    if (voucher.canCancel) {
      const label = voucher.creationType === VoucherCreationTypeEnum.BOUGHT ? this.i18n.voucher.cancelAndRefund : this.i18n.general.cancel;
      actions.push(new HeadingAction('cancel', label, () => {
        // TODO: CANCEL THE VOUCHER (we don't have api right now)
        this.notification.info('the voucher was canceled', true);
      }));
    }
    return actions;
  }

}
