import { Component, OnInit, ChangeDetectionStrategy, Injector, Input } from '@angular/core';
import {
  VouchersDataForSearch, VoucherStatusEnum, VoucherCreationTypeEnum, UserVouchersDataForSearch, Group
} from 'app/api/models';
import { FieldOption } from 'app/shared/field-option';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'voucher-filters',
  templateUrl: './voucher-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VoucherFiltersComponent extends BaseComponent implements OnInit {

  @Input() adminData: VouchersDataForSearch;
  @Input() userData: UserVouchersDataForSearch;
  @Input() heading: string;
  @Input() mobileHeading: string;
  @Input() form: FormGroup;

  mask: string;
  isVoucherSearch: boolean;
  isUserVoucherSearch: boolean;
  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    this.isUserVoucherSearch = !!this.userData;
    this.isVoucherSearch = !!this.adminData;
  }

  get data(): (VouchersDataForSearch | UserVouchersDataForSearch) {
    return this.adminData ? this.adminData : this.userData;
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

  get userGroups(): Group[] {
    return this.isVoucherSearch ? this.adminData.userGroups : [];
  }

  get maxScale(): number {
    return this.adminData.types
      .map(t => t.configuration.currency.decimalDigits)
      .reduce((previous, current, _index, _array) => previous > current ? previous : current);
  }

}
