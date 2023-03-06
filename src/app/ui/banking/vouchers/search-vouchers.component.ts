import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { CustomFieldDetailed, GeneralVouchersDataForSearch } from 'app/api/models';
import { HeadingAction } from 'app/shared/action';
import { BaseSearchVouchersComponent, VoucherSearchParams } from 'app/ui/banking/vouchers/base-search-vouchers.component';
import { Menu } from 'app/ui/shared/menu';
@Component({
  selector: 'search-vouchers',
  templateUrl: './search-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchVouchersComponent
  extends BaseSearchVouchersComponent<GeneralVouchersDataForSearch, VoucherSearchParams>
  implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  customFieldsInSearch: CustomFieldDetailed[];

  ngOnInit() {
    super.ngOnInit();
    this.addSub(this.vouchersService.getGeneralVouchersDataForSearch({}).subscribe(dataForSearch => this.data = dataForSearch));
  }

  prepareForm(data: GeneralVouchersDataForSearch) {
    this.customFieldsInSearch = [];
    data.fieldsInBasicSearch.forEach(f => {
      var field: any = data.customFields.find(cf => cf.internalName === f);
      if (field) {
        this.customFieldsInSearch.push(field);
      }
    });

    this.form.setControl('customFields',
      this.fieldHelper.customFieldsForSearchFormGroup(this.customFieldsInSearch, data.query.customFields));
  }

  protected onDataInitialized(data: GeneralVouchersDataForSearch) {
    super.onDataInitialized(data);

    const headingActions: HeadingAction[] = [this.moreFiltersAction];
    if (data.canGenerate) {
      headingActions.push(new HeadingAction(this.SvgIcon.Ticket, this.i18n.voucher.generate.generate, () => this.generate()));
    }
    headingActions.push(...this.exportActions(data));
    this.headingActions = headingActions;
  }

  private exportActions(data: GeneralVouchersDataForSearch): HeadingAction[] {
    return this.exportHelper.headingActions(data.exportFormats,
      f => this.vouchersService.exportVouchers$Response({
        format: f.internalName,
        ...this.toSearchParams(this.form.value)
      }));
  }

  private generate() {
    this.router.navigate(['/banking', 'vouchers', 'generate']);
  }

  protected getFormControlNames(): string[] {
    return ['types', 'creationBegin', 'creationEnd', 'statuses', 'token', 'creationType', 'printed', 'customFields',
      'amountMin', 'amountMax', 'expirationBegin', 'expirationEnd', 'transactionDateBegin', 'transactionDateEnd', 'buyer',
      'transactionUser', 'buyerGroups', 'transactionUserGroups', 'email', 'mobilePhone', 'orderBy'];
  }

  protected toSearchParams(value: any): VoucherSearchParams {
    const result = super.toSearchParams(value);
    if (value.transactionDateBegin || value.transactionDateEnd) {
      result.transactionPeriod = this.ApiHelper.dateRangeFilter(value.redeemBegin, value.redeemEnd);
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

    result.customFields = this.fieldHelper.toCustomValuesFilter(value.customFields);

    return result;
  }

  resolveMenu(_data: GeneralVouchersDataForSearch) {
    return Menu.SEARCH_VOUCHERS;
  }
}
