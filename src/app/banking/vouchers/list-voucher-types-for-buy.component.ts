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
  selector: 'list-voucher-types-for-buy',
  templateUrl: 'list-voucher-types-for-buy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListVoucherTypesForBuyComponent extends BaseSearchPageComponent<any, any, VoucherTypeDetailed> implements OnInit {

  userParam: string;

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

    const params = this.route.snapshot.params;
    this.userParam = this.authHelper.isSelf(params.user) ? this.ApiHelper.SELF : params.user;

    this.data = {};
  }

  toLink() {
    return (type: VoucherTypeDetailed) => this.path(type);
  }

  path(type: VoucherTypeDetailed) {
    return ['/banking/vouchers', this.userParam, type.id, 'buy'];
  }
}
