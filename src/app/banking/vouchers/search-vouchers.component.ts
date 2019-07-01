import { Component, OnInit, ChangeDetectionStrategy, Injector } from '@angular/core';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { VoucherResult, VouchersDataForSearch, VouchersQueryFilters, VoucherStatusEnum, VoucherCreationTypeEnum } from 'app/api/models';
import { VouchersService } from 'app/api/services';
import { FieldOption } from 'app/shared/field-option';
import { BankingHelperService } from 'app/core/banking-helper.service';

type VoucherSearchParams = VouchersQueryFilters & {
  fields?: Array<string>;
};
@Component({
  selector: 'app-search-vouchers',
  templateUrl: './search-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchVouchersComponent
  extends BaseSearchPageComponent<VouchersDataForSearch, VoucherSearchParams, VoucherResult>
  implements OnInit {

  mask: string;
  constructor(
    injector: Injector,
    private voucherService: VouchersService,
    private bankingHelper: BankingHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.voucherService.getVouchersDataForSearch({})
      .subscribe(dataForSearch => {
        this.data = dataForSearch;
        this.mask = this.data.mask ? this.data.mask : '';
      }));
  }

  protected getFormControlNames(): string[] {
    return ['types', 'creationBegin', 'creationEnd', 'statuses', 'token', 'creationType', 'printed',
      'amountMin', 'amountMax', 'expirationBegin', 'expirationEnd', 'redeemBegin', 'redeemEnd', 'buyer',
      'redeemer', 'buyerGroups', 'redeemerGroups'];
  }

  protected toSearchParams(value: any): VoucherSearchParams {
    if (value.redeemBegin || value.redeemEnd) {
      value['redeemPeriod'] = this.ApiHelper.dateRangeFilter(value.redeemBegin, value.redeemEnd);
    }
    if (value.creationBegin || value.creationEnd) {
      value['creationPeriod'] = this.ApiHelper.dateRangeFilter(value.creationBegin, value.creationEnd);
    }
    if (value.expirationBegin || value.expirationEnd) {
      value['expirationPeriod'] = this.ApiHelper.dateRangeFilter(value.expirationBegin, value.expirationEnd);
    }
    if (value.amountMin || value.amountMax) {
      value['amountRange'] = this.ApiHelper.rangeFilter(value.amountMin, value.amountMax);
    }
    //if (!value.printed) {
    //  delete value['printed'];
    //}

    delete value['redeemBegin'];
    delete value['redeemEnd'];
    delete value['creationBegin'];
    delete value['creationEnd'];
    delete value['expirationBegin'];
    delete value['expirationEnd'];
    return value;
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
}
