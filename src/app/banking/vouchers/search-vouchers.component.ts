import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { VoucherCreationTypeEnum, VoucherResult, VouchersDataForSearch, VouchersQueryFilters, VoucherStatusEnum } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { Menu } from 'app/shared/menu';

type VoucherSearchParams = VouchersQueryFilters & {
  fields?: Array<string>;
};
@Component({
  selector: 'search-vouchers',
  templateUrl: './search-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchVouchersComponent
  extends BaseSearchPageComponent<VouchersDataForSearch, VoucherSearchParams, VoucherResult>
  implements OnInit {

  constructor(
    injector: Injector,
    private voucherService: VouchersService,
    public bankingHelper: BankingHelperService,
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.voucherService.getVouchersDataForSearch({})
      .subscribe(dataForSearch => this.data = dataForSearch));
  }

  protected onDataInitialized(_data) {
    super.onDataInitialized(_data);
    this.headingActions = [this.moreFiltersAction];
    this.form.patchValue(_data.query);
  }

  protected getFormControlNames(): string[] {
    return ['types', 'creationBegin', 'creationEnd', 'statuses', 'token', 'creationType', 'printed',
      'amountMin', 'amountMax', 'expirationBegin', 'expirationEnd', 'redeemBegin', 'redeemEnd', 'buyer',
      'redeemer', 'buyerGroups', 'redeemerGroups', 'orderBy'];
  }

  protected toSearchParams(value: any): VoucherSearchParams {
    const result: VoucherSearchParams = value;
    if (value.redeemBegin || value.redeemEnd) {
      result.redeemPeriod = this.ApiHelper.dateRangeFilter(value.redeemBegin, value.redeemEnd);
    }
    if (value.creationBegin || value.creationEnd) {
      result.creationPeriod = this.ApiHelper.dateRangeFilter(value.creationBegin, value.creationEnd);
    }
    if (value.expirationBegin || value.expirationEnd) {
      result.expirationPeriod = this.ApiHelper.dateRangeFilter(value.expirationBegin, value.expirationEnd);
    }
    if (value.amountMin || value.amountMax) {
      result.amountRange = this.ApiHelper.rangeFilter(value.amountMin, value.amountMax);
    }
    if (value.printed === 'all') {
      result.printed = null;
    }
    if (value.creationType === 'all') {
      result.creationType = null;
    }
    return result;
  }

  protected doSearch(value: VoucherSearchParams) {
    return this.voucherService.searchVouchers$Response(value);
  }

  get statusOptions(): FieldOption[] {
    const statuses = Object.values(VoucherStatusEnum) as VoucherStatusEnum[];
    return statuses.map(st => ({ value: st, text: this.bankingHelper.voucherStatus(st) }));
  }

  get creationTypeOptions(): FieldOption[] {
    const statuses = Object.values(VoucherCreationTypeEnum) as VoucherCreationTypeEnum[];
    return statuses.map(st => ({ value: st, text: this.bankingHelper.voucherCreationType(st) }))
      .concat({ value: null, text: this.i18n.general.all });
  }

  get toLink() {
    return (row: VoucherResult) => this.path(row);
  }

  path(row: VoucherResult): string[] {
    return ['/banking/vouchers/', row.id];
  }

  showMoreFiltersLabel() {
    return this.i18n.general.showFilters;
  }

  showLessFiltersLabel() {
    return this.i18n.general.hideFilters;
  }

  resolveMenu(_data: VouchersDataForSearch) {
    return Menu.SEARCH_VOUCHERS;
  }
}
