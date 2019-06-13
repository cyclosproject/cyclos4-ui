import { HttpResponse } from '@angular/common/http';
import { Component, Injector, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { VoucherTypeDetailed } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Observable } from 'rxjs';

/**
 * List the types the logged user can buy vouchers for.
 */
@Component({
  selector: 'voucher-types-for-buy',
  templateUrl: 'voucher-types-for-buy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherTypesForBuyComponent extends BaseSearchPageComponent<any, any, VoucherTypeDetailed> implements OnInit {

  constructor(
    injector: Injector,
    private voucherService: VouchersService
  ) {
    super(injector);
  }

  protected getFormControlNames(): string[] {
    return [];
  }
  protected toSearchParams(value: any): any {
    return value;
  }

  protected doSearch(): Observable<HttpResponse<VoucherTypeDetailed[]>> {
    return this.voucherService.listVoucherTypesForBuy$Response({ user: ApiHelper.SELF });
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.data = {};
  }

}
