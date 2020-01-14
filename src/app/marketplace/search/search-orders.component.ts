import { ChangeDetectionStrategy, OnInit, Component, Injector } from '@angular/core';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { UserOrderResult } from 'app/api/models/user-order-result';
import { QueryFilters, OrderStatusEnum, OrderResult, OrderDataForSearch } from 'app/api/models';
import { OrdersService, MarketplaceService } from 'app/api/services';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { Menu } from 'app/shared/menu';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';

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
  selector: 'search-orders',
  templateUrl: 'search-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchOrdersComponent
  extends BaseSearchPageComponent<any, SearchUserOrdersParams, UserOrderResult>
  implements OnInit {

  param: string;
  sales: boolean;
  isOwner: boolean;

  showForm$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    protected marketplaceHelper: MarketplaceHelperService,
    protected marketplaceService: MarketplaceService,
    protected orderService: OrdersService
  ) {
    super(injector);
  }

  protected getFormControlNames() {
    return ['statuses', 'periodBegin', 'periodEnd', 'relatedUser', 'number', 'productNumber'];
  }

  ngOnInit() {
    super.ngOnInit();
    this.sales = this.route.snapshot.url[1].path === 'sales';
    this.param = this.route.snapshot.paramMap.get('user') || this.ApiHelper.SELF;
    this.isOwner = this.authHelper.isSelf(this.param);
    this.addSub(this.orderService.getOrderDataForSearch({ user: this.param, sales: this.sales }).subscribe(data => this.data = data));
  }

  protected toSearchParams(value: any): SearchUserOrdersParams {
    const result: SearchUserOrdersParams = value;
    value.user = this.param;
    value.sales = this.sales;
    if (value.periodBegin || value.periodEnd) {
      result.creationPeriod = this.ApiHelper.dateRangeFilter(value.periodBegin, value.periodEnd);
    }
    return value;
  }

  onDataInitialized(data: any) {
    super.onDataInitialized(data);
    this.addSub(this.layout.ltsm$.subscribe(() => {
      this.headingActions = this.layout.ltsm ? [this.moreFiltersAction] : [];
    }));
  }

  showMoreFiltersLabel() {
    return this.i18n.general.showFilters;
  }

  showLessFiltersLabel() {
    return this.i18n.general.hideFilters;
  }

  doSearch(filters: SearchUserOrdersParams): Observable<HttpResponse<UserOrderResult[]>> {
    return this.orderService.searchUserOrders$Response(filters);
  }

  /**
   * Resolves the route to order details page
   */
  get toLink() {
    return (row: UserOrderResult) => this.path(row);
  }

  path(row: UserOrderResult): string[] {
    return ['/marketplace', 'order', row.id];
  }

  /**
   * Returns the status label for the given order
   */
  resolveStatusLabel(order: OrderResult): string {
    return this.marketplaceHelper.resolveOrderStatusLabel(order.status);
  }

  resolveMenu(data: OrderDataForSearch) {
    if (this.isOwner) {
      return this.sales ? Menu.SALES : Menu.PURCHASES;
    }
    return this.authHelper.searchUsersMenu(data.user);
  }

}
