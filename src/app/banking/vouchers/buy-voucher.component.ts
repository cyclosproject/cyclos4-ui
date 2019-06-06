import { BasePageComponent } from 'app/shared/base-page.component';
import { VoucherDataForBuy } from 'app/api/models/voucher-data-for-buy';
import { Component, ChangeDetectionStrategy, Injector, OnInit } from '@angular/core';
import { VouchersService } from 'app/api/services';

@Component({
  selector: 'buy-voucher',
  templateUrl: 'buy-voucher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuyVoucherComponent extends BasePageComponent<VoucherDataForBuy> implements OnInit {
  constructor(
    injector: Injector,
    private voucherService: VouchersService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.voucherService.getVoucherDataForBuy({ user: this.ApiHelper.SELF, type: '' })
      .subscribe(data => this.data = data);
  }
}
