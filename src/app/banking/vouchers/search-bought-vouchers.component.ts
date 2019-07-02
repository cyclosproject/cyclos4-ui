import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Component, ChangeDetectionStrategy, Injector, OnInit } from '@angular/core';
import { UserVouchersDataForSearch, VoucherResult, VoucherRelationEnum, VoucherStatusEnum } from 'app/api/models';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VouchersService } from 'app/api/services';
import { UserVouchersQueryFilters } from 'app/api/models/user-vouchers-query-filters';
import { cloneDeep } from 'lodash';
import { FieldOption } from 'app/shared/field-option';

type UserVouchersSearchParams = UserVouchersQueryFilters & { user: string };

@Component({
  selector: 'search-bought-vouchers',
  templateUrl: 'search-bought-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBoughtVouchersComponent
  extends BaseSearchPageComponent<UserVouchersDataForSearch, UserVouchersSearchParams, VoucherResult> implements OnInit {

  user: string;
  constructor(injector: Injector, private vouchersService: VouchersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const params = this.route.snapshot.params;
    this.user = this.authHelper.isSelf(params.user) ? this.ApiHelper.SELF : params.user;

    this.addSub(
      this.vouchersService.getUserVouchersDataForSearch({ user: this.user, relation: VoucherRelationEnum.BOUGHT })
        .subscribe(data => {
          this.form.patchValue(data.query, { emitEvent: false });
          this.data = data;
        })
    );
  }

  get statusOptions(): FieldOption[] {
    const statuses = Object.values(VoucherStatusEnum) as VoucherStatusEnum[];
    return statuses.map(st => ({
      value: st,
      text: this.voucherStatus(st)
    }));
  }

  protected getFormControlNames(): string[] {
    return ['types', 'statuses'];
  }

  protected toSearchParams(value: any): UserVouchersSearchParams {
    const params: UserVouchersSearchParams = cloneDeep(value);
    params.user = this.user;
    return params;
  }

  protected doSearch(query: UserVouchersSearchParams): Observable<HttpResponse<VoucherResult[]>> {
    return this.vouchersService.searchUserVouchers$Response(query);
  }

  get toLink() {
    return (row: VoucherResult) => this.path(row);
  }

  path(row: VoucherResult): string[] {
    return ['/banking/vouchers/', row.id];
  }

  voucherStatus(status: VoucherStatusEnum): string {
    switch (status) {
      case VoucherStatusEnum.CANCELED:
        return this.i18n.voucher.status.canceled;
      case VoucherStatusEnum.EXPIRED:
        return this.i18n.voucher.status.expired;
      case VoucherStatusEnum.OPEN:
        return this.i18n.voucher.status.open;
      case VoucherStatusEnum.PENDING:
        return this.i18n.voucher.status.pending;
      case VoucherStatusEnum.REDEEMED:
        return this.i18n.voucher.status.redeemed;
    }
  }
}
