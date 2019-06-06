import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';
import { UserVouchersDataForSearch, VoucherResult } from 'app/api/models';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VouchersService } from 'app/api/services';

@Component({
  selector: 'search-bought-vouchers',
  templateUrl: 'search-bought-vouchers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBoughtVouchersComponent extends BaseSearchPageComponent<UserVouchersDataForSearch, VoucherResult> {
  constructor(
    injector: Injector,
    private vouchersService: VouchersService
  ) {
    super(injector);
  }
  protected getFormControlNames(): string[] {
    return [];
  }

  protected doSearch(query: any): Observable<HttpResponse<VoucherResult[]>> {
    return this.vouchersService.searchUserVouchers$Response(query);
  }


}