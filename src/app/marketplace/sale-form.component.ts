import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { OrderDataForEdit, OrderDataForNew } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { OrdersService } from 'app/api/services';
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
    private orderService: OrdersService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  submit() {
  }

  resolveMenu() {
    return Menu.SALES;
  }
}
