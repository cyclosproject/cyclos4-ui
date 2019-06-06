import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { OnInit, Injector } from '@angular/core';
import { VoucherTypeDetailed } from 'app/api/models';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VouchersService } from 'app/api/services';
import { ApiHelper } from 'app/shared/api-helper';


export class VoucherTypeForBuyListComponent extends BaseSearchPageComponent<any, VoucherTypeDetailed> implements OnInit {

  constructor(
    injector: Injector,
    private voucherService: VouchersService
  ) {
    super(injector);
  }

  protected getFormControlNames(): string[] {
    return [];
  }
  protected doSearch(value: any): Observable<HttpResponse<VoucherTypeDetailed[]>> {
    return this.voucherService.listVoucherTypesForBuy$Response({ user: ApiHelper.SELF });
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

}