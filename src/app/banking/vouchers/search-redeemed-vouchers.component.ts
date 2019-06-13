import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { UserVouchersDataForSearch, VoucherResult, VoucherRelationEnum } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-search-redeemed-vouchers',
  templateUrl: './search-redeemed-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchRedeemedVouchersComponent extends BaseSearchPageComponent<UserVouchersDataForSearch, VoucherResult> implements OnInit {



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
  doSearch(value: any) {
    const params = cloneDeep(value);
    params['user'] = this.ApiHelper.SELF;

    return this.voucherService.searchUserVouchers$Response(params);
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
