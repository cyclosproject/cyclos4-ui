import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserVouchersDataForSearch, UserVouchersQueryFilters, VoucherCreationTypeEnum, VoucherStatusEnum } from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { FieldOption } from 'app/shared/field-option';
import { BaseSearchVouchersComponent, VoucherSearchParams } from 'app/ui/banking/vouchers/base-search-vouchers.component';
import { Menu } from 'app/ui/shared/menu';


type UserVoucherSearchParams = VoucherSearchParams & UserVouchersQueryFilters & {
  user: string;
  fields?: Array<string>;
};

@Component({
  selector: 'search-user-vouchers',
  templateUrl: 'search-user-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchUserVouchersComponent
  extends BaseSearchVouchersComponent<UserVouchersDataForSearch, UserVoucherSearchParams> implements OnInit {

  VoucherStatusEnum = VoucherStatusEnum;

  param: string;
  self: boolean;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.param = this.route.snapshot.paramMap.get('user');
    this.addSub(this.vouchersService.getUserVouchersDataForSearch({
      user: this.param
    }).subscribe(dataForSearch => {
      this.data = dataForSearch;
    }));
  }

  onDataInitialized(data: UserVouchersDataForSearch) {
    super.onDataInitialized(data);
    this.self = this.authHelper.isSelf(data.user);
    const headingActions: HeadingAction[] = [];
    if (data.canBuy) {
      headingActions.push(new HeadingAction(SvgIcon.TicketBuy, this.i18n.voucher.buy.buy, () => this.buy(), true));
    }
    if (data.canSend) {
      headingActions.push(new HeadingAction(SvgIcon.TicketSend, this.i18n.voucher.send.send, () => this.send(), true));
    }
    this.headingActions = headingActions;
  }

  protected toSearchParams(value: any): UserVoucherSearchParams {
    const params: UserVoucherSearchParams = super.toSearchParams(value);
    params.user = this.param;
    params.fields = [
      'id', 'amount', 'balance', 'status', 'creationDate', 'expirationDate',
      'type.image', 'type.voucherTitle', 'type.configuration.currency'
    ];
    return params;
  }

  protected doSearch(value: UserVoucherSearchParams) {
    return this.vouchersService.searchUserVouchers$Response(value);
  }

  protected getFormControlNames(): string[] {
    return ['types', 'token', 'statuses', 'creationType'];
  }

  private buy() {
    this.router.navigate(['/banking', this.param, 'vouchers', 'buy']);
  }

  private send() {
    this.router.navigate(['/banking', this.param, 'vouchers', 'send']);
  }

  get creationTypeOptions(): FieldOption[] {
    const statuses = [
      VoucherCreationTypeEnum.BOUGHT,
      VoucherCreationTypeEnum.SENT,
      VoucherCreationTypeEnum.GENERATED
    ];
    return statuses.map(st => ({ value: st, text: this.apiI18n.voucherCreationType(st, true) }));
  }

  useInactiveStatus() {
    // There's no point on searching for inactive vouchers with a user
    return false;
  }

  resolveMenu(data: UserVouchersDataForSearch) {
    return this.menu.userMenu(data.user, Menu.SEARCH_MY_VOUCHERS);
  }
}
