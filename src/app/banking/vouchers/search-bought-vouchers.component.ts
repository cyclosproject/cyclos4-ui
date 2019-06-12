import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { UserVouchersDataForSearch, VoucherResult } from 'app/api/models';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VouchersService } from 'app/api/services';
import { UserVouchersQueryFilters } from 'app/api/models/user-vouchers-query-filters';
import { ApiHelper } from 'app/shared/api-helper';
import { cloneDeep } from 'lodash';

type UserVouchersSearchParams = UserVouchersQueryFilters & { user: string };

@Component({
  selector: 'search-bought-vouchers',
  templateUrl: 'search-bought-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBoughtVouchersComponent
  extends BaseSearchPageComponent<UserVouchersDataForSearch, UserVouchersSearchParams, VoucherResult> {
  constructor(
    injector: Injector,
    private vouchersService: VouchersService
  ) {
    super(injector);
  }
  protected getFormControlNames(): string[] {
    return [];
  }

  protected toSearchParams(value: any): UserVouchersSearchParams {
    const params: UserVouchersSearchParams = cloneDeep(value);
    params.user = ApiHelper.SELF;
    return params;
  }
  protected doSearch(query: UserVouchersSearchParams): Observable<HttpResponse<VoucherResult[]>> {
    return this.vouchersService.searchUserVouchers$Response(query);
  }
}