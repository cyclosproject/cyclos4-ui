import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { UserVouchersDataForSearch, VoucherResult, VoucherRelationEnum, UserVouchersQueryFilters } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { Menu } from 'app/shared/menu';

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

  self: boolean;

  constructor(
    injector: Injector,
    private voucherService: VouchersService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const user = this.route.snapshot.paramMap.get('user');
    this.addSub(this.voucherService.getUserVouchersDataForSearch({
      user: user, relation: VoucherRelationEnum.REDEEMED
    }).subscribe(dataForSearch => {
      this.data = dataForSearch;
      this.self = this.authHelper.isSelf(dataForSearch.user);
    }));
  }

  protected getFormControlNames(): string[] {
    return ['types', 'periodBegin', 'periodEnd', 'operator'];
  }

  protected toSearchParams(value: any): UserVoucherSearchParams {
    const params: UserVoucherSearchParams = value;
    params.user = this.route.snapshot.paramMap.get('user');
    params.relation = VoucherRelationEnum.REDEEMED;
    params.redeemBy = value.operator;
    if (value.periodBegin || value.periodEnd) {
      params.redeemPeriod = this.ApiHelper.dateRangeFilter(value.periodBegin, value.periodEnd);
    }
    return params;
  }

  protected doSearch(value: UserVoucherSearchParams) {
    return this.voucherService.searchUserVouchers$Response(value);
  }

  get toLink() {
    return (row: VoucherResult) => this.path(row);
  }

  path(row: VoucherResult): string[] {
    return ['/banking/vouchers/', row.id];
  }

  resolveMenu(data: UserVouchersDataForSearch) {
    return this.authHelper.userMenu(data.user, Menu.SEARCH_REDEEMED);
  }

}
