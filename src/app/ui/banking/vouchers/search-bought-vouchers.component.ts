import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { UserVouchersDataForSearch, VoucherRelationEnum, VoucherResult, VoucherStatusEnum } from 'app/api/models';
import { UserVouchersQueryFilters } from 'app/api/models/user-vouchers-query-filters';
import { VouchersService } from 'app/api/services/vouchers.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { FieldOption } from 'app/shared/field-option';
import { Menu } from 'app/ui/shared/menu';
import { cloneDeep } from 'lodash-es';
import { Observable } from 'rxjs';

type UserVouchersSearchParams = UserVouchersQueryFilters & { user: string };

@Component({
  selector: 'search-bought-vouchers',
  templateUrl: 'search-bought-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoughtVouchersComponent
  extends BaseSearchPageComponent<UserVouchersDataForSearch, UserVouchersSearchParams, VoucherResult> implements OnInit {

  user: string;
  self: boolean;

  constructor(injector: Injector, private vouchersService: VouchersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const params = this.route.snapshot.params;
    this.self = this.authHelper.isSelf(params.user);
    this.user = this.self ? this.ApiHelper.SELF : params.user;

    this.addSub(
      this.vouchersService.getUserVouchersDataForSearch({ user: this.user, relation: VoucherRelationEnum.BOUGHT })
        .subscribe(data => {
          this.form.patchValue(data.query);
          this.data = data;
        }),
    );
  }

  get statusOptions(): FieldOption[] {
    const statuses = Object.values(VoucherStatusEnum) as VoucherStatusEnum[];
    return statuses.map(st => ({
      value: st,
      text: this.voucherStatus(st),
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
    return ['/banking/vouchers/view/', row.id];
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

  resolveMenu(data: UserVouchersDataForSearch) {
    return this.menu.userMenu(data.user, Menu.SEARCH_BOUGHT_VOUCHERS);
  }
}
