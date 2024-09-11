import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { OrderStatusEnum, OrderView } from 'app/api/models';
import { OrdersService } from 'app/api/services/orders.service';
import { MarketplaceHelperService } from 'app/ui/core/marketplace-helper.service';
import { BaseViewPageComponent } from 'app/ui/shared/base-view-page.component';
import { Menu } from 'app/ui/shared/menu';

@Component({
  selector: 'view-order-history',
  templateUrl: 'view-order-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewOrderHistoryComponent extends BaseViewPageComponent<OrderView> implements OnInit {
  constructor(
    injector: Injector,
    private marketplaceHelper: MarketplaceHelperService,
    private orderService: OrdersService
  ) {
    super(injector);
  }

  id: string;
  seller: boolean;
  buyer: boolean;

  ngOnInit() {
    super.ngOnInit();
    this.id = this.route.snapshot.params.id;
    this.addSub(
      this.orderService.viewOrder({ order: this.id, fields: ['seller', 'buyer', 'history'] }).subscribe(data => {
        this.data = data;
      })
    );
  }

  onDataInitialized(data: OrderView) {
    this.seller = this.authHelper.isSelfOrOwner(data.seller);
    this.buyer = !this.seller && this.authHelper.isSelfOrOwner(data.buyer);
  }

  get onClick() {
    // No op condition to disable built-in click (mobile layout)
    return (row: any) => row != null;
  }

  /**
   * Resolves the current order status label
   */
  resolveStatusLabel(status: OrderStatusEnum): string {
    return this.marketplaceHelper.resolveOrderStatusLabel(status);
  }

  resolveMenu() {
    if (this.buyer) {
      return Menu.PURCHASES;
    } else if (this.seller) {
      return Menu.SALES;
    }
    return this.menu.searchUsersMenu();
  }
}
