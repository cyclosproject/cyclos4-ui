import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  UserImportedFileContextEnum,
  UserMenuEnum, UserVouchersDataForSearch, UserVouchersQueryFilters, VoucherCreationTypeEnum, VoucherStatusEnum
} from 'app/api/models';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { ApiHelper } from 'app/shared/api-helper';
import { FieldOption } from 'app/shared/field-option';
import { BaseSearchVouchersComponent, VoucherSearchParams } from 'app/ui/banking/vouchers/base-search-vouchers.component';
import { ExportHelperService } from 'app/ui/core/export-helper.service';
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
    this.addSub(this.vouchersService.getUserVouchersDataForSearch({ user: this.param }).subscribe(data => this.data = data));
  }

  prepareForm(_data: UserVouchersDataForSearch) {
    this.form.patchValue({ creationType: 'all' });
  }

  onDataInitialized(data: UserVouchersDataForSearch) {
    super.onDataInitialized(data);
    this.self = this.authHelper.isSelf(data.user);
    const headingActions: HeadingAction[] = [this.moreFiltersAction];
    if (data.canBuy) {
      headingActions.push(new HeadingAction(SvgIcon.TicketArrowLeft, this.i18n.voucher.buy.buy, () => this.buy()));
    }
    if (data.canSend) {
      headingActions.push(new HeadingAction(SvgIcon.TicketArrowRight, this.i18n.voucher.send.send, () => this.send()));
    }
    if (data.canSendImport) {
      headingActions.push(new HeadingAction(SvgIcon.ArrowUpCircle, this.i18n.voucher.send.sendImport, () => this.sendImport()));
    }

    headingActions.push(...this.exportActions(data));
    this.headingActions = headingActions;
    this.form.get('creationType')?.valueChanges.subscribe(() => {
      this.headingActions$.next(this.headingActions.filter(action => action.id !== ExportHelperService.EXPORT_ACTION));
      if (this.form.get('creationType')?.value !== VoucherCreationTypeEnum.SENT) {
        this.headingActions.push(...this.exportActions(data));
      }
    });
  }

  private exportActions(data: UserVouchersDataForSearch): HeadingAction[] {
    return this.exportHelper.headingActions(data.exportFormats,
      f => this.vouchersService.exportUserVouchers$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      }));
  }

  protected toSearchParams(value: any): UserVoucherSearchParams {
    const params: UserVoucherSearchParams = super.toSearchParams(value);
    params.user = this.param;
    params.amountRange = ApiHelper.rangeFilter(value.minAmount, value.maxAmount);
    params.creationPeriod = ApiHelper.dateRangeFilter(value.beginCreationDate, value.endCreationDate);
    params.expirationPeriod = ApiHelper.dateRangeFilter(value.beginExpirationDate, value.endExpirationDate);
    if ((params.creationType as string) === 'all') {
      params.creationType = null;
    }
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
    return ['types', 'token', 'statuses', 'creationType', 'minAmount', 'maxAmount',
      'beginCreationDate', 'endCreationDate', 'beginExpirationDate', 'endExpirationDate'];
  }

  private buy() {
    this.router.navigate(['/banking', this.param, 'vouchers', 'buy']);
  }

  private send() {
    this.router.navigate(['/banking', this.param, 'vouchers', 'send']);
  }

  private sendImport() {
    this.router.navigate(['/imports', this.param, UserImportedFileContextEnum.USER_SEND_VOUCHERS, 'files']);
  }

  get creationTypeOptions(): FieldOption[] {
    const statuses = [
      'all',
      VoucherCreationTypeEnum.BOUGHT,
      VoucherCreationTypeEnum.SENT
    ];
    return statuses.map(st => ({
      value: st,
      text: st === 'all' ? this.i18n.general.all : this.apiI18n.voucherCreationType(st as VoucherCreationTypeEnum)
    }));
  }

  useInactiveStatus() {
    // There's no point on searching for inactive vouchers with a user
    return false;
  }

  resolveMenu(data: UserVouchersDataForSearch) {
    return this.menu.userMenu(data.user, this.dataForFrontendHolder.dataForFrontend.voucherBuyingMenu == UserMenuEnum.MARKETPLACE ?
      Menu.SEARCH_MY_VOUCHERS_MARKETPLACE : Menu.SEARCH_MY_VOUCHERS_BANKING);
  }
}
