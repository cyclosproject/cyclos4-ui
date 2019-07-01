import { Component, OnInit, ChangeDetectionStrategy, Injector, Input } from '@angular/core';
import {
  VouchersDataForSearch, VoucherStatusEnum, VoucherCreationTypeEnum, UserVouchersDataForSearch, TransferFilter
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

  @Input() data: VouchersDataForSearch;
  @Input() userData: UserVouchersDataForSearch;
  @Input() heading: string;
  @Input() mobileHeading: string;
  @Input() form: FormGroup;
  @Input() transferFilters: TransferFilter[];

  mask: string;
  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
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

}
