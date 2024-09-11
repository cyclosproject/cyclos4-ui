import { Directive, Injector } from '@angular/core';
import { BaseVouchersDataForSearch, VoucherResult, VouchersQueryFilters, VoucherStatusEnum } from 'app/api/models';
import { VouchersService } from 'app/api/services/vouchers.service';
import { FieldOption } from 'app/shared/field-option';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';

export type VoucherSearchParams = VouchersQueryFilters & {
  fields?: Array<string>;
};

/**
 * Common methods for pages that search voucher
 */
@Directive()
export abstract class BaseSearchVouchersComponent<
  D extends BaseVouchersDataForSearch,
  P extends VoucherSearchParams
> extends BaseSearchPageComponent<D, P, VoucherResult> {
  protected vouchersService: VouchersService;

  constructor(injector: Injector) {
    super(injector);
    this.vouchersService = injector.get(VouchersService);
  }

  protected toSearchParams(value: any): P {
    return value;
  }

  protected doSearch(value: P) {
    return this.vouchersService.searchVouchers$Response(value);
  }

  get statusOptions(): FieldOption[] {
    let statuses = Object.values(VoucherStatusEnum) as VoucherStatusEnum[];
    if (!this.useInactiveStatus()) {
      statuses = statuses.filter(st => st !== VoucherStatusEnum.INACTIVE);
    }
    return statuses.map(st => ({ value: st, text: this.apiI18n.voucherStatus(st) }));
  }

  protected useInactiveStatus() {
    return true;
  }

  get toLink() {
    return (row: VoucherResult) => this.path(row);
  }

  path(row: VoucherResult): string[] {
    return ['/banking/vouchers/view/', row.id];
  }
}
