import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { UserVouchersDataForSearch, VoucherResult, VoucherRelationEnum, UserVouchersQueryFilters } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { cloneDeep } from 'lodash';

type UserVoucherSearchParams = UserVouchersQueryFilters & {
  user: string;
  fields?: Array<string>;
};

@Component({
  selector: 'app-search-redeemed-vouchers',
  templateUrl: './search-redeemed-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchRedeemedVouchersComponent
  extends BaseSearchPageComponent<UserVouchersDataForSearch, UserVoucherSearchParams, VoucherResult>
  implements OnInit {

  constructor(
    injector: Injector,
    private voucherService: VouchersService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.addSub(this.voucherService.getUserVouchersDataForSearch({
      user: this.ApiHelper.SELF, relation: VoucherRelationEnum.REDEEMED
    }).subscribe(dataForSearch => this.data = dataForSearch));
  }

  protected getFormControlNames(): string[] {
    return ['types', 'periodBegin', 'periodEnd'];
  }

  protected toSearchParams(value: any): UserVoucherSearchParams {
    const params = cloneDeep(value);
    params['user'] = this.ApiHelper.SELF;
    params['relation'] = VoucherRelationEnum.REDEEMED;
    delete params['periodBegin'];
    delete params['periodEnd'];
    if (value.periodBegin || value.periodEnd) {
      params['redeemPeriod'] = this.ApiHelper.dateRangeFilter(value.periodBegin, value.periodEnd);
    }
    return params;
  }

  protected doSearch(value: UserVoucherSearchParams) {
    return this.voucherService.searchUserVouchers$Response(value);
  }

  get toLink() {
    return (row: VoucherResult) => this.path(row);
  }
  /**
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: VoucherResult): string[] {
    return ['/banking/vouchers/', row.id];
  }

}
