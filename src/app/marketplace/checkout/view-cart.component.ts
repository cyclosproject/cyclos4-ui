import { ChangeDetectionStrategy, Component, OnInit, Injector } from '@angular/core';
import { ShoppingCartView } from 'app/api/models';
import { BasePageComponent } from 'app/shared/base-page.component';
import { Menu } from 'app/shared/menu';
import { ShoppingCartsService } from 'app/api/services';

/**
 * Edits a shopping cart by changing quantity or removing items
 */
@Component({
  selector: 'view-cart',
  templateUrl: 'view-cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewCartComponent
  extends BasePageComponent<ShoppingCartView>
  implements OnInit {

  id: string;

  constructor(
    injector: Injector,
    private shoppingCartService: ShoppingCartsService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.id = this.route.snapshot.params.id;

    this.addSub(this.shoppingCartService.adjustAndGetShoppingCartDetails({ id: this.id }).subscribe(data => {
      this.data = data;
    }));
  }

  resolveMenu() {
    return Menu.SHOPPING_CART;
  }
}
