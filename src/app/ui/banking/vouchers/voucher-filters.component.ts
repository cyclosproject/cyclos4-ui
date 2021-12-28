import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { VoucherCreationTypeEnum, VoucherOrderByEnum, VouchersDataForSearch, VoucherStatusEnum } from 'app/api/models';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { FieldOption } from 'app/shared/field-option';

@Component({
  selector: 'voucher-filters',
  templateUrl: './voucher-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoucherFiltersComponent extends BaseComponent implements OnInit {

  @Input() data: VouchersDataForSearch;
  @Input() heading: string;
  @Input() mobileHeading: string;
  @Input() form: FormGroup;
  @Input() moreFilters: boolean;
  @Input() headingActions: HeadingAction[];

  mask: string;
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.mask = this.data.mask ? this.data.mask : '';
  }

  get statusOptions(): FieldOption[] {
    const statuses = Object.values(VoucherStatusEnum) as VoucherStatusEnum[];
    return statuses.map(st => ({ value: st, text: this.apiI18n.voucherStatus(st) }));
  }

  get creationTypeOptions(): FieldOption[] {
    const statuses = Object.values(VoucherCreationTypeEnum) as VoucherCreationTypeEnum[];
    const result = [];
    return result.concat(statuses.map(st => ({ value: st, text: this.apiI18n.voucherCreationType(st) })));
  }

  get maxScale(): number {
    return this.data.types
      .map(t => t.configuration.currency.decimalDigits)
      .reduce((previous, current, _index, _array) => previous > current ? previous : current);
  }

  orderByOptions(): VoucherOrderByEnum[] {
    return Object.values(VoucherOrderByEnum) as VoucherOrderByEnum[];
  }

  orderBy(order: VoucherOrderByEnum): string {
    switch (order) {
      case VoucherOrderByEnum.CREATION_DATE_ASC:
        return this.i18n.voucher.sort.creationDateAsc;
      case VoucherOrderByEnum.CREATION_DATE_DESC:
        return this.i18n.voucher.sort.creationDateDesc;
      case VoucherOrderByEnum.EXPIRATION_DATE_ASC:
        return this.i18n.voucher.sort.expirationDateAsc;
      case VoucherOrderByEnum.EXPIRATION_DATE_DESC:
        return this.i18n.voucher.sort.expirationDateDesc;
      case VoucherOrderByEnum.REDEEM_DATE_ASC:
        return this.i18n.voucher.sort.redeemDateAsc;
      case VoucherOrderByEnum.REDEEM_DATE_DESC:
        return this.i18n.voucher.sort.redeemDateDesc;
    }
  }
}
