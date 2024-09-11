import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import {
  CustomFieldControlEnum,
  CustomFieldDetailed,
  CustomFieldTypeEnum,
  LinkedEntityTypeEnum,
  OrderDataForSearch,
  OrderResult,
  OrderStatusEnum,
  QueryFilters
} from 'app/api/models';
import { UserOrderResult } from 'app/api/models/user-order-result';
import { OrdersService } from 'app/api/services/orders.service';
import { SvgIcon } from 'app/core/svg-icon';
import { HeadingAction } from 'app/shared/action';
import { empty } from 'app/shared/helper';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { BaseSearchPageComponent } from 'app/ui/shared/base-search-page.component';
import { Menu } from 'app/ui/shared/menu';
import { BehaviorSubject, Observable } from 'rxjs';

type SearchUserOrdersParams = QueryFilters & {
  user: string;
  creationPeriod: string[];
  number: string;
  productNumber: string;
  relatedUser: string;
  sales: boolean;
  statuses: OrderStatusEnum[];
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
  extends BaseSearchPageComponent<OrderDataForSearch, SearchUserOrdersParams, UserOrderResult>
  implements OnInit
{
  param: string;
  sales: boolean;
  isOwner: boolean;

  showForm$ = new BehaviorSubject(false);

  constructor(
    injector: Injector,
    private marketplaceHelper: MarketplaceHelperService,
    private orderService: OrdersService
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
    this.addSub(
      this.orderService
        .getOrderDataForSearch({ user: this.param, sales: this.sales })
        .subscribe(data => (this.data = data))
    );
  }

  protected toSearchParams(value: any): SearchUserOrdersParams {
    value.user = this.param;
    value.sales = this.sales;
    if (value.periodBegin || value.periodEnd) {
      value.creationPeriod = this.ApiHelper.dateRangeFilter(value.periodBegin, value.periodEnd);
    }
    return value;
  }

  onDataInitialized(data: OrderDataForSearch) {
    super.onDataInitialized(data);
    this.headingActions = this.initActions(data);
    this.addSub(this.layout.ltsm$.subscribe(() => (this.headingActions = this.initActions(data))));
  }

  protected initActions(data: OrderDataForSearch) {
    const actions: HeadingAction[] = [];
    if (this.sales && data.canCreateNew) {
      const newAction = new HeadingAction(SvgIcon.PlusCircle, this.i18n.general.addNew, () => this.addNew(), true);
      actions.push(newAction);
    }
    if (this.layout.ltsm) {
      actions.push(this.moreFiltersAction);
    }
    return actions;
  }

  private addNew() {
    this.confirmation.confirm({
      title: this.i18n.ad.title.newOrder,
      labelPosition: 'above',
      customFields: this.newOrderFields(),
      callback: res => {
        // Validate the user can create a new sale
        this.addSub(
          this.orderService
            .getOrderDataForNew({
              buyer: res.customValues.buyer,
              user: this.param,
              currency: res.customValues.currency
            })
            .subscribe(() => {
              this.router.navigate(['/marketplace', this.param, 'sale', 'new'], {
                queryParams: {
                  buyer: res.customValues.buyer,
                  currency: res.customValues.currency
                }
              });
            })
        );
      }
    });
  }

  protected newOrderFields(): CustomFieldDetailed[] {
    const fields: CustomFieldDetailed[] = [
      {
        internalName: 'buyer',
        name: this.i18n.ad.buyer,
        type: CustomFieldTypeEnum.LINKED_ENTITY,
        control: CustomFieldControlEnum.ENTITY_SELECTION,
        linkedEntityType: LinkedEntityTypeEnum.USER,
        hasValuesList: false,
        required: true
      }
    ];
    if (!empty(this.data.currencies) && this.data.currencies.length > 1) {
      fields.push({
        internalName: 'currency',
        name: this.i18n.general.currency,
        type: CustomFieldTypeEnum.SINGLE_SELECTION,
        control: CustomFieldControlEnum.SINGLE_SELECTION,
        hasValuesList: true,
        defaultValue: this.data.currencies[0].id,
        possibleValues: this.data.currencies.map(c => {
          return {
            id: c.id,
            value: c.name
          };
        }),
        required: true
      });
    }
    return fields;
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
    if (row.status === OrderStatusEnum.DRAFT) {
      return ['/marketplace', 'sale', row.id];
    }
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
    return this.menu.searchUsersMenu(data.user);
  }
}
