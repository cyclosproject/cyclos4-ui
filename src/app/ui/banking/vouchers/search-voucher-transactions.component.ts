import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  UserVouchersDataForSearch,
  UserVoucherTransactionsDataForSearch,
  UserVoucherTransactionsQueryFilters,
  VoucherTransactionKind,
  VoucherTransactionResult
} from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';

type UserVoucherTransactionsSearchParams = UserVoucherTransactionsQueryFilters & {
  user: string;
  fields?: Array<string>;
};
@Component({
  selector: 'search-voucher-transactions',
  templateUrl: './search-voucher-transactions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchVoucherTransactionsComponent
  extends BaseSearchPageComponent<
    UserVoucherTransactionsDataForSearch,
    UserVoucherTransactionsSearchParams,
    VoucherTransactionResult
  >
  implements OnInit
{
  VoucherTransactionKind = VoucherTransactionKind;

  param: string;
  self: boolean;

  constructor(injector: Injector, private vouchersService: VouchersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.paramMap.get('user');
    this.addSub(
      this.vouchersService
        .getUserVoucherTransactionsDataForSearch({ user: this.param })
        .subscribe(data => (this.data = data))
    );
  }

  protected getFormControlNames(): string[] {
    return ['types', 'kinds', 'periodBegin', 'periodEnd'];
  }

  onDataInitialized(data: UserVoucherTransactionsDataForSearch) {
    super.onDataInitialized(data);
    this.self = this.authHelper.isSelf(data.user);
    const headingActions: HeadingAction[] = [];
    if (data.canRedeem) {
      headingActions.push(
        new HeadingAction(SvgIcon.TicketArrowDown, this.i18n.voucher.redeem.redeem, () => this.redeem(), true)
      );
    }
    if (data.canTopUp) {
      headingActions.push(
        new HeadingAction(SvgIcon.TicketArrowUp, this.i18n.voucher.topUp.topUp, () => this.topUp(), true)
      );
    }
    this.headingActions = headingActions;
  }

  protected toSearchParams(value: any): UserVoucherTransactionsSearchParams {
    const params = value as UserVoucherTransactionsSearchParams;
    params.user = this.param;
    if (value.periodBegin || value.periodEnd) {
      params.datePeriod = this.ApiHelper.dateRangeFilter(value.periodBegin, value.periodEnd);
    }
    params.fields = ['id', 'date', 'kinds', 'amount', 'type.voucherTitle', 'type.configuration.currency', 'type.image'];
    return params;
  }

  protected doSearch(filters: UserVoucherTransactionsSearchParams) {
    return this.vouchersService.searchUserVoucherTransactions$Response(filters);
  }

  get kindsOptions() {
    const values = [VoucherTransactionKind.REDEEM, VoucherTransactionKind.TOP_UP, VoucherTransactionKind.CHARGEBACK];
    return values.map(kind => ({ value: kind, text: this.apiI18n.voucherTransactionKind(kind) }));
  }

  resolveVoucherTransactionsTitle(): string {
    return this.data.topUpEnabled ? this.i18n.voucher.title.transactions : this.i18n.voucher.title.transactionsRedeems;
  }

  resolveVoucherTransactionsMobileTitle(): string {
    return this.data.topUpEnabled
      ? this.i18n.voucher.mobileTitle.transactions
      : this.i18n.voucher.mobileTitle.transactionsRedeems;
  }

  private redeem() {
    this.router.navigate(['/banking', this.param, 'vouchers', 'redeem']);
  }

  private topUp() {
    this.router.navigate(['/banking', this.param, 'vouchers', 'top-up']);
  }

  get toLink() {
    return (row: VoucherTransactionResult) => this.path(row);
  }

  path(row: VoucherTransactionResult): string[] {
    return ['/banking', 'voucher-transactions', 'view', row.id];
  }

  resolveMenu(data: UserVouchersDataForSearch) {
    return this.menu.userMenu(data.user, Menu.VOUCHER_TRANSACTIONS);
  }
}
