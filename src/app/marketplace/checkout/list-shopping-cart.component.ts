import { Component, ChangeDetectionStrategy, OnInit, Injector } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';
import { ShoppingCartResult } from 'app/api/models';
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
  extends BasePageComponent<ShoppingCartResult[]> implements OnInit {

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

  onDataInitialized(data: ShoppingCartResult[]) {
    if (data.length === 1) {
      // Go to details when there is a single cart
      this.router.navigate(this.path(data[0]), {
        replaceUrl: true
      });
    }
  }

  resolveMenu() {
    return Menu.SHOPPING_CART;
  }

  get toLink() {
    return (row: ShoppingCartResult) => this.path(row);
  }

  /**
   * Returns the route components for a cart details
   */
  path(row: ShoppingCartResult): string[] {
    return ['/marketplace', 'cart', row.id];
  }
}
