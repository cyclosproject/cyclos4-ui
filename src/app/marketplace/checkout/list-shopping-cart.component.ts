import { Component, ChangeDetectionStrategy, OnInit, Injector } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { ShoppingCartResult } from 'app/api/models';
import { List } from 'lodash';
import { Menu } from 'app/shared/menu';
import { ShoppingCartsService } from 'app/api/services';

/**
 * A page to start with the shopping cart process, it display possible orders grouped by seller and currency.
 * If there is a single seller and currency this page is skipped.
 */
@Component({
  selector: 'list-shopping-cart',
  templateUrl: 'list-shopping-cart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListShoppingCartComponent
  extends BasePageComponent<List<ShoppingCartResult>> implements OnInit {

  constructor(
    injector: Injector,
    private shoppingCartService: ShoppingCartsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    this.addSub(this.shoppingCartService.getShoppingCarts({}).subscribe(data => {
      this.data = data;
    }));
  }

  resolveMenu() {
    return Menu.SHOPPING_CART;
  }

}
