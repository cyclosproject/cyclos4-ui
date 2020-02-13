import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { OrderDataForEdit, OrderDataForNew } from 'app/api/models';
import { OrdersService } from 'app/api/services';
import { MarketplaceHelperService } from 'app/core/marketplace-helper.service';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { Observable } from 'rxjs';

/**
 * Create or edit a sale (initiated by seller) for an specific user and currency
 */
@Component({
  selector: 'sale-form',
  templateUrl: 'sale-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaleFormComponent
  extends BasePageComponent<OrderDataForNew | OrderDataForEdit>
  implements OnInit {

  create: boolean;

  constructor(
    injector: Injector,
    private orderService: OrdersService,
    public marketplaceHelper: MarketplaceHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    const buyer = this.route.snapshot.queryParams.buyer;
    const currency = this.route.snapshot.queryParams.currency;
    const id = this.route.snapshot.params.id;
    const user = this.route.snapshot.params.user;
    this.create = id == null;

    const request: Observable<OrderDataForNew | OrderDataForEdit> = this.create
      ? this.orderService.getOrderDataForNew({
        buyer: buyer,
        user: user,
        currency: currency
      })
      : this.orderService.getOrderDataForEdit({
        order: id
      });
    this.addSub(request.subscribe(data => {
      this.data = data;
    }));
  }

  submit() {
  }

  resolveMenu() {
    return Menu.SALES;
  }
}
