import { ChangeDetectionStrategy, OnInit, Component, Injector } from '@angular/core';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { UserOrderResult } from 'app/api/models/user-order-result';
import { QueryFilters, OrderStatusEnum } from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

type SearchUserOrdersParams = QueryFilters & {
  user: string,
  creationPeriod: string[],
  number: string,
  productNumber: string,
  relatedUser: string,
  sales: boolean,
  statuses: OrderStatusEnum[],
};


/**
 * Lists the orders (purchases, sales) of a given user
 */
@Component({
  selector: 'list-orders',
  templateUrl: 'list-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListOrdersComponent
  extends BaseSearchPageComponent<any, SearchUserOrdersParams, UserOrderResult>
  implements OnInit {

  constructor(
    injector: Injector,
    protected orderService: OrdersService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return [];
  }

  ngOnInit() {
    super.ngOnInit();
  }

  protected toSearchParams(value: any): SearchUserOrdersParams {
    return value;
  }

  doSearch(filters: SearchUserOrdersParams): Observable<HttpResponse<UserOrderResult[]>> {
    return this.orderService.searchUserOrders$Response(filters);
  }

  resolveMenu() {
    return null;
  }

}
